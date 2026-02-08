import type { Plugin } from "esbuild";
import type { AcceptedPlugin } from "postcss";

export interface PostCssPluginOptions {
  plugins?: AcceptedPlugin[];
}

declare function postCssPlugin(options?: PostCssPluginOptions): Plugin;
export = postCssPlugin;
