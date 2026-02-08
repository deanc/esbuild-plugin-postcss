import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import autoprefixer from "autoprefixer";
import esbuild from "esbuild";
import postCssPlugin from "../dist/index.js";

const autoPrefixerPlugin = autoprefixer({
  overrideBrowserslist: ["last 2 versions", "chrome >= 4"],
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
process.chdir(path.resolve(__dirname));

test("simplest case", async () => {
  fs.rmSync(".output", { recursive: true, force: true });

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
