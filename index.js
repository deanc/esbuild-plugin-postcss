const fs = require("fs-extra");
const postcss = require("postcss");
const util = require("util");
const tmp = require("tmp");
const path = require("path");
const { sync: resolve } = require("resolve");

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
        let sourceFullPath;

        // Use Node's module resolution algorithm for modules from node_modules
        if (args.path.startsWith('.') || path.isAbsolute(args.path)) {
          sourceFullPath = path.resolve(args.resolveDir, args.path);
        } else {
          sourceFullPath = resolve(args.path, { basedir: args.resolveDir });
        }

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

        return {
          path: tmpFilePath,
        };
      }
    );
  },
});
