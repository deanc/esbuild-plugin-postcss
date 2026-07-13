import fs from "node:fs/promises";
import path from "node:path";
import postcss, { type AcceptedPlugin } from "postcss";
import type { Plugin } from "esbuild";

export interface PostCssPluginOptions {
  plugins?: AcceptedPlugin[];
}

export default function postCssPlugin(
  options: PostCssPluginOptions = {},
): Plugin {
  const plugins = options.plugins ?? [];

  return {
    name: "postcss",
    setup(build) {
      build.onLoad(
        { filter: /\.css$/, namespace: "file" },
        async (args) => {
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
        },
      );
    },
  };
}
