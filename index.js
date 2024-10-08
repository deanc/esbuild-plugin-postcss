const fs = require("fs-extra");
const postcss = require("postcss");
const util = require("util");
const tmp = require("tmp");
const path = require("path");

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const ensureDir = util.promisify(fs.ensureDir);

module.exports = (options = { plugins: [] }) => ({
  name: "postcss",
  setup: function (build) {
    const { rootDir = options.rootDir || process.cwd() } = options;
    const tmpDirPath = tmp.dirSync().name;
    build.onResolve(
      { filter: /.\.(css)$/, namespace: "file" },
      async (args) => {
        // use esbuild path resolution for node_modules, typescript paths, etc.
        // https://esbuild.github.io/plugins/#resolve
        const resolution = await build.resolve(args.path, {
          resolveDir: args.resolveDir,
          kind: args.kind,
        });
        if (resolution.errors.length > 0) {
          return { errors: result.errors }
        }

        const sourceFullPath = resolution.path;
        const sourceExt = path.extname(sourceFullPath);
        const sourceBaseName = path.basename(sourceFullPath, sourceExt);
        const sourceDir = path.dirname(sourceFullPath);
        const sourceRelDir = path.relative(path.dirname(rootDir), sourceDir);

        const tmpDir = path.resolve(tmpDirPath, sourceRelDir);
        const tmpFilePath = path.resolve(tmpDir, `${sourceBaseName}.css`);
        await ensureDir(tmpDir);

        const css = await readFile(sourceFullPath);
        const result = await postcss(options.plugins).process(css, {
          from: sourceFullPath,
          to: tmpFilePath,
        });

        // Write the result file
        await writeFile(tmpFilePath, result.css);

        // https://esbuild.github.io/plugins/#on-resolve-results
        return {
          path: tmpFilePath,
          // watch for changes to the original input for automatic rebuilds
          watchFiles: [ sourceFullPath ],
        };
      }
    );
  },
});
