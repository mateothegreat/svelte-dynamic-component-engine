import { svelte } from "@sveltejs/vite-plugin-svelte";
import { svelteInspector } from "@sveltejs/vite-plugin-svelte-inspector";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import versionPlugin from "../vite-plugin-version";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    svelte(),
    svelteInspector({
      toggleKeyCombo: "alt-x",
      showToggleButton: "always",
      toggleButtonPos: "bottom-left"
    }),
    versionPlugin(),
    /**
     * This sets it so that when you change a file, the whole page will reload
     * rather than hmr only reloading the changes.
     */
    // {
    //   name: "full-reload",
    //   handleHotUpdate({ server }) {
    //     server.ws.send({ type: "full-reload" });
    //     return [];
    //   }
    // },
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@mateothegreat/dynamic-component-engine": path.resolve(__dirname, "../src/index.ts"),
      $lib: path.resolve(__dirname, "./src/lib"),
      $components: path.resolve(__dirname, "./src/lib/components/ui")
    }
  }
});
