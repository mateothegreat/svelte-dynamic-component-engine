import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern"
      }
    }
  },
  plugins: [
    svelte({
      // exclude: /\.wc\.svelte$/,
      hot: true
    }),
    svelte({
      compilerOptions: {
        customElement: true
      },
      typescript: {}
    })
  ]
});
