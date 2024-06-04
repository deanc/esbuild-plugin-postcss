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
        let sourceFullPath;

        // Manual attempt at resolving from node_modules and other typical directories
        if (args.path.startsWith('.') || path.isAbsolute(args.path)) {
          sourceFullPath = path.resolve(args.resolveDir, args.path);
        } else {
          const modulePaths = [
            // possible locations for node modules, maybe this is not strictly necessary
            path.resolve(args.resolveDir, 'node_modules', args.path),
            path.resolve(rootDir, 'node_modules', args.path),
            path.resolve(rootDir, '../node_modules', args.path)
          ];
          
          for (const modulePath of modulePaths) {
            if (fs.existsSync(modulePath)) {
              // if we find the path we need, use it as the sourceFullPath
              sourceFullPath = modulePath;
              break;
            }
          }
          
          if (!sourceFullPath) {
            throw new Error(`Cannot resolve module: ${args.path}`);
          }
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
