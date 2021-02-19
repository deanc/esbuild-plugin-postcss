const fs = require("fs-extra");
const postcss = require("postcss");
const util = require("util");
const tmp = require("tmp");
const path = require("path");

const postcssModules = require("postcss-modules");
const stylus = require("stylus");
const less = require("less");

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const ensureDir = util.promisify(fs.ensureDir);

module.exports = (options = { plugins: [], modules: true }) => ({
  name: "postcss",
  setup: function (build) {
    const { rootDir = options.rootDir || process.cwd() } = options;
    const tmpDirPath = tmp.dirSync().name;
    const modules = {};
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

        // parse css modules with "postcss-modules"
        if (options.modules !== false && sourceBaseName.match(/\.module$/)) {
          options.plugins.unshift(
            postcssModules({
              ...(typeof options.modules === "object" ? options.modules : {}),
              getJSON(filepath, json, outpath) {
                modules[tmpFilePath] = json;

                if (
                  typeof options.modules === "object" &&
                  typeof options.modules.getJSON === "function"
                )
                  return options.modules.getJSON(filepath, json, outpath);
              },
            })
          );
        }

        // parse files with preprocessors
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

        // wait for plugins to complete parsing & get result
        const result = await postcss(options.plugins).process(css, {
          from: sourceFullPath,
          to: tmpFilePath,
        });

        // Write result file
        await writeFile(tmpFilePath, result.css);

        return {
          path: tmpFilePath,
          namespace: sourceBaseName.match(/\.module$/)
            ? "postcss-modules"
            : undefined,
        };
      }
    );
    build.onLoad({ filter: /.*/, namespace: "postcss-modules" }, (args) => {
      return {
        contents: JSON.stringify(modules[args.path] ?? {}),
        loader: "json",
      };
    });
  },
});

function renderSass(options) {
  return new Promise((resolve, reject) => {
    getSassImpl().render(options, (e, res) => {
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

function getSassImpl() {
  let impl = "sass";
  try {
    require.resolve("sass");
  } catch {
    try {
      require.resolve("node-sass");
      impl = "node-sass";
    } catch {
      throw new Error('Please install "sass" or "node-sass" package');
    }
  }
  return require(impl);
}
