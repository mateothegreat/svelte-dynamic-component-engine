import { svelte } from "@sveltejs/vite-plugin-svelte";
import { svelteInspector } from "@sveltejs/vite-plugin-svelte-inspector";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginVersionMark } from "vite-plugin-version-mark";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    svelte(),
    svelteInspector({
      toggleKeyCombo: "alt-x",
      showToggleButton: "always",
      toggleButtonPos: "bottom-left"
    }),
    /**
     * This sets it so that when you change a file, the whole page will reload
     * rather than hmr only reloading the changes.
     */
    {
      name: "full-reload",
      handleHotUpdate({ server }) {
        server.ws.send({ type: "full-reload" });
        return [];
      }
    },
    tailwindcss(),
    vitePluginVersionMark({
      // name: 'test-app',
      // version: '0.0.1',
      // command: 'git describe --tags',
      name: "@mateothegreat/dynamic-component-engine",
      ifGitSHA: true,
      ifShortSHA: true,
      ifMeta: true,
      ifLog: true,
      ifGlobal: true
    })
  ],
  resolve: {
    alias: {
      "@mateothegreat/dynamic-component-engine": path.resolve(__dirname, "../src/index.ts")
    }
  }
});
