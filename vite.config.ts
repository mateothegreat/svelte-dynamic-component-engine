import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    svelte(),
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
    }
  ]
});
