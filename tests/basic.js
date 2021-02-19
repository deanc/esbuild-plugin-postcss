const test = require("tape");
const path = require("path");
const autoprefixer = require("autoprefixer");
const fs = require("fs-extra");

const autoPrefixerPlugin = autoprefixer({
  browsers: ["last 2 versions", "chrome >= 4"],
});

process.chdir(path.resolve(__dirname));

const postCssPlugin = require("../index.js");

test("simplest case", function (t) {
  (async () => {
    fs.removeSync(".output");

    await require("esbuild").build({
      entryPoints: ["basic/index.js"],
      bundle: true,
      outfile: ".output/bundle.js",
      plugins: [
        postCssPlugin({
          plugins: [autoPrefixerPlugin],
          modules: true,
        }),
      ],
    });

    t.ok(fs.existsSync("./.output/bundle.js"), "Bundled js file should exist");
    t.ok(
      fs.existsSync("./.output/bundle.css"),
      "Bundled css file should exist"
    );

    const fileContent = fs.readFileSync("./.output/bundle.css").toString();

    t.ok(
      fileContent.indexOf(`-webkit-border-radius`) !== -1,
      "Should contain prefixed selector"
    );

    t.end();
  })().catch((e) => t.fail(e.message));
});
