(Huge thanks to https://github.com/koluch/esbuild-plugin-sass which this is based off)

# esbuild-plugin-postcss

![CI](https://github.com/deanc/esbuild-plugin-postcss/actions/workflows/ci.yml/badge.svg)

Plugin for [esbuild](https://esbuild.github.io/) to support PostCSS

## Install

```bash
npm i esbuild @deanc/esbuild-plugin-postcss
```
or yarn
```bash
yarn add esbuild @deanc/esbuild-plugin-postcss
```
or pnpm
```bash
pnpm add esbuild @deanc/esbuild-plugin-postcss
```

## Usage example

Create file `src/test.css`:

```css
input[type="text"] {
  border-radius: 1px;
}
```

Create file `src/index.js`:

```js
import "./test.css";
```

Create file `build.js`:

```js
const esbuild = require("esbuild");
const autoprefixer = require("autoprefixer");
const postCssPlugin = require("@deanc/esbuild-plugin-postcss");

esbuild
  .build({
    entryPoints: ["src/index.js"],
    bundle: true,
    outfile: "bundle.js",
    plugins: [
      postCssPlugin({
        plugins: [autoprefixer()],
      }),
    ],
  })
  .catch((e) => console.error(e.message));
```

Run:

```bash
node build.js
```

File named `bundle.css` with appropriate postcss plugins applied.

## Requirements

- Node.js 18+

## Contributing

- This repo uses pnpm for CI. If you use pnpm locally, run `pnpm import` once to create `pnpm-lock.yaml`.

## Releases

- The release workflow uses npm trusted publishing with provenance. Ensure trusted publishing is enabled for this package in npm before running the workflow.
- Release checklist:
  1. Ensure CI is green on `main`.
  2. Verify `CHANGELOG.md` has entries under `[Unreleased]`.
  3. Run the "Release package" workflow with the desired release type.
