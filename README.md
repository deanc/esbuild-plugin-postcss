(Huge thanks to https://github.com/koluch/esbuild-plugin-sass which this is based off)

# esbuild-plugin-postcss

![Node.js CI](https://github.com/deanc/esbuild-plugin-postcss/workflows/Node.js%20CI/badge.svg)

Plugin for [esbuild](https://esbuild.github.io/) to support PostCSS

## Install

```bash
npm i esbuild esbuild-plugin-postcss
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
const postCssPlugin = require("esbuild-plugin-postcss");

esbuild
  .build({
    entryPoints: ["src/index.js"],
    bundle: true,
    outfile: "bundle.js",
    plugins: [
      postCssPlugin({
        plugins: [autoprefixer],
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

### Preprocessors
To use preprocessors, like `sass`, `scss`, `less` or `stylus`, install it as a dev dependency:

```bash
npm i sass
```