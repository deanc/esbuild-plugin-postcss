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
  const outputDir = path.join(__dirname, ".output");
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });

  await esbuild.build({
    entryPoints: [path.join(__dirname, "basic/index.js")],
    bundle: true,
    outfile: path.join(outputDir, "bundle.js"),
    plugins: [
      postCssPlugin({
        plugins: [autoPrefixerPlugin],
      }),
    ],
  });
  esbuild.stop();

  assert.ok(fs.existsSync(path.join(outputDir, "bundle.js")));
  assert.ok(fs.existsSync(path.join(outputDir, "bundle.css")));

  const fileContent = fs
    .readFileSync(path.join(outputDir, "bundle.css"))
    .toString();

  assert.ok(fileContent.includes("-webkit-border-radius"));
  assert.ok(fileContent.includes("display: flex"));
});

test("processes CSS resolved through tsconfig paths", async () => {
  const outputDir = path.join(__dirname, ".output");
  const result = await esbuild.build({
    stdin: {
      contents: 'import "example.css";',
      resolveDir: __dirname,
      loader: "js",
    },
    bundle: true,
    outfile: path.join(outputDir, "alias.js"),
    write: false,
    tsconfigRaw: {
      compilerOptions: {
        baseUrl: __dirname,
        paths: { "example.css": ["./basic/example.css"] },
      },
    },
    plugins: [postCssPlugin({ plugins: [autoPrefixerPlugin] })],
  });
  esbuild.stop();

  const css = result.outputFiles.find((file) => file.path.endsWith(".css"));
  assert.ok(css?.text.includes("-webkit-border-radius"));
});
