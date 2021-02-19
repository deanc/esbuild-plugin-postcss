const fs = require("fs-extra");
const postcss = require("postcss");
const util = require("util");
const tmp = require("tmp");
const path = require("path");

const sass = require("sass");
const stylus = require("stylus");
const less = require("less");

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const ensureDir = util.promisify(fs.ensureDir);

module.exports = (options = { plugins: [] }) => ({
  name: "postcss",
  setup: function (build) {
    const { rootDir = options.rootDir || process.cwd() } = options;
    const tmpDirPath = tmp.dirSync().name;
    build.onResolve(
      { filter: /.\.(css|sass|scss|less|styl)$/, namespace: "file" },
      async (args) => {
        const sourceFullPath = path.resolve(args.resolveDir, args.path);
        const sourceExt = path.extname(sourceFullPath);
        const sourceBaseName = path.basename(sourceFullPath, sourceExt);
        const sourceDir = path.dirname(sourceFullPath);
        const sourceRelDir = path.relative(path.dirname(rootDir), sourceDir);

        const tmpDir = path.resolve(tmpDirPath, sourceRelDir);
        const tmpFilePath = path.resolve(
          tmpDir,
          `${sourceBaseName}-tmp-${Date.now()}.css`
        );
        await ensureDir(tmpDir);

        const fileContent = await readFile(sourceFullPath);
        let css = sourceExt === ".css" ? fileContent : "";

        if (sourceExt === ".sass" || sourceExt === ".scss")
          css = (await renderSass({ file: sourceFullPath })).css.toString();
        if (sourceExt === ".styl")
          css = await renderStylus(new TextDecoder().decode(fileContent), {
            filename: sourceFullPath,
          });
        if (sourceExt === ".less")
          css = (
            await less.render(new TextDecoder().decode(fileContent), {
              filename: sourceFullPath,
              rootpath: path.dirname(args.path),
            })
          ).css;

        const result = postcss(options.plugins).process(css, {
          from: sourceFullPath,
          to: tmpFilePath,
        });

        // Write result file
        await writeFile(tmpFilePath, result.css);

        return {
          path: tmpFilePath,
        };
      }
    );
  },
});

function renderSass(options) {
  return new Promise((resolve, reject) => {
    sass.render(options, (e, res) => {
      if (e) reject(e);
      else resolve(res);
    });
  });
}

function renderStylus(str, options) {
  return new Promise((resolve, reject) => {
    stylus.render(str, options, (e, res) => {
      if (e) reject(e);
      else resolve(res);
    });
  });
}
