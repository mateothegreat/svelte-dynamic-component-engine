import { svelte } from "@sveltejs/vite-plugin-svelte";
import { svelteInspector } from "@sveltejs/vite-plugin-svelte-inspector";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { versionPlugin } from "./src/lib/version/vite-plugin-version";

export default defineConfig({
  logLevel: "info",
  plugins: [
    versionPlugin({
      locations: ["package.json"]
    }),
    tsconfigPaths(),
    svelte(),
    svelteInspector({
      toggleKeyCombo: "alt-x",
      showToggleButton: "always",
      toggleButtonPos: "bottom-left"
    }),
    tailwindcss()
  ],
  build: {
    reportCompressedSize: true
  },
  resolve: {
    alias: {
      "@mateothegreat/dynamic-component-engine": path.resolve(__dirname, "../src/index.ts"),
      $lib: path.resolve(__dirname, "./src/lib"),
      $components: path.resolve(__dirname, "./src/lib/components/ui")
    }
  }
});
