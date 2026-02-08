const fs = require("node:fs/promises");
const postcss = require("postcss");
const path = require("node:path");

module.exports = (options = {}) => {
  const plugins = options.plugins ?? [];

  return {
    name: "postcss",
    setup(build) {
      build.onResolve({ filter: /\.css$/, namespace: "file" }, async (args) => {
        // Use esbuild path resolution for node_modules, tsconfig paths, etc.
        // https://esbuild.github.io/plugins/#resolve
        const resolution = await build.resolve(args.path, {
          resolveDir: args.resolveDir,
          kind: args.kind,
        });

        if (resolution.errors.length > 0) {
          return { errors: resolution.errors };
        }

        return {
          path: resolution.path,
          namespace: "postcss",
        };
      });

      build.onLoad({ filter: /\.css$/, namespace: "postcss" }, async (args) => {
        const sourceFullPath = args.path;
        const css = await fs.readFile(sourceFullPath, "utf8");

        if (plugins.length === 0) {
          return {
            contents: css,
            loader: "css",
            resolveDir: path.dirname(sourceFullPath),
            watchFiles: [sourceFullPath],
          };
        }

        const result = await postcss(plugins).process(css, {
          from: sourceFullPath,
        });

        return {
          contents: result.css,
          loader: "css",
          resolveDir: path.dirname(sourceFullPath),
          watchFiles: [sourceFullPath],
        };
      });
    },
  };
};
