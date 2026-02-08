const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const autoprefixer = require("autoprefixer");
const fs = require("node:fs");

const autoPrefixerPlugin = autoprefixer({
  overrideBrowserslist: ["last 2 versions", "chrome >= 4"],
});

process.chdir(path.resolve(__dirname));

const postCssPlugin = require("../index.js");

test("simplest case", async () => {
  fs.rmSync(".output", { recursive: true, force: true });

  const esbuild = require("esbuild");

  await esbuild.build({
    entryPoints: ["basic/index.js"],
    bundle: true,
    outfile: ".output/bundle.js",
    plugins: [
      postCssPlugin({
        plugins: [autoPrefixerPlugin],
      }),
    ],
  });
  esbuild.stop();

  assert.ok(fs.existsSync("./.output/bundle.js"));
  assert.ok(fs.existsSync("./.output/bundle.css"));

  const fileContent = fs.readFileSync("./.output/bundle.css").toString();

  assert.ok(fileContent.includes("-webkit-border-radius"));
  assert.ok(fileContent.includes("display: flex"));
});
