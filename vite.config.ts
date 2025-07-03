import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    {
      name: "full-reload",
      handleHotUpdate({ server }) {
        server.ws.send({ type: "full-reload" });
        return [];
      }
    }
  ],
  // optimizeDeps: {
  //   exclude: ["svelte-preprocess"]
  // }
  root: "./",
  build: {
    outDir: "./dist",
    emptyOutDir: true,
    lib: {
      entry: "./src/components/index.ts",
      formats: ["es"],
      name: "svelte-components",
      fileName: (format) =>
        ({
          es: `svelte-components.js`,
          esm: `svelte-components.min.js`,
          umd: `svelte-components.umd.js`
        })[format]
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: false,
        chunkFileNames: "[name].js",
        manualChunks: {
          svelte: ["svelte"],
          components: ["./src/components/index.ts"]
        }
      }
    }
  }
});
