import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    coverage: {
      provider: "v8",
      reporter: ["json"],
      exclude: ["node_modules/", "src/test-setup.ts", "**/*.test.ts", "**/*.test.js", "dist/"]
    }
  }
});
