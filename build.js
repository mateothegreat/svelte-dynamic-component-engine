import esbuild from "esbuild";
import esbuildSvelte from "esbuild-svelte";
import { sveltePreprocess } from "svelte-preprocess";

async function bundleSvelte(entry) {
  const build = await esbuild.build({
    logLevel: "debug",
    entryPoints: Array.isArray(entry) ? entry : [entry],
    target: "esnext",
    format: "esm",
    splitting: false,
    packages: "external",
    banner: {
      js: "// I'm compiled from entry.ts which imports simple.svelte using esbuild-svelte."
    },
    bundle: true,
    outdir: "./public",
    plugins: [
      esbuildSvelte({
        preprocess: sveltePreprocess()
      })
    ]
  });

  return build.outputFiles;
}

bundleSvelte(["./src/components/entry.ts"]);
