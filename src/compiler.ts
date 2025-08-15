#!/usr/bin/env node

import type { Format, BuildOptions } from "esbuild";
import * as esbuild from "esbuild";
import esbuildSvelte from "esbuild-svelte";
import { glob } from "glob";
import { sveltePreprocess } from "svelte-preprocess";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const template = `
import type { Rendered } from "@mateothegreat/dynamic-component-engine";
import { mount, unmount, type ComponentProps } from "svelte";
import NAME from "./NAME.svelte";

/**
 * Handy type alias for the props of the NAME component that can
 * be used all over and anywhere.
 */
export type NAMEProps = ComponentProps<typeof NAME>;

/**
 * The factory function is used to create a new instance of the component
 * when being rendered on the receiving side.
 *
 * This is important because it allows us to have granular control over the component
 * lifecycle and not require the receiving side to bear that burden.
 *
 * @param {HTMLElement} target The target element to mount the component on.
 * @param {NAMEProps} props The props to pass to the component.
 *
 * @returns {Rendered<NAMEProps>} A Rendered object that contains the component, name, props, and destroy function.
 */
const factory = (target: HTMLElement, props?: NAMEProps): Rendered<NAMEProps> => {
  const component = mount(NAME, {
    target,
    props: props as NAMEProps
  });

  return {
    component,
    name: "NAME",
    props: props as NAMEProps,
    destroy: () => {
      console.log("entry.ts -> NAME.svelte", "destroying component", component);
      unmount(component);
    }
  };
};

/**
 * Export the factory function as the default export to make it easier
 * on the receiving side performing the dynamic import.
 */
export { factory as default };
`;
// Define the options interface
interface CompilerOptions {
  input: string;
  output: string;
  target: string;
  format: string;
  debug: boolean;
  banner: string;
}

// Interface for component source input
interface ComponentSource {
  name: string;
  source: string;
  filename?: string;
}

/**
 * Bundle Svelte components using esbuild and esbuild-svelte plugin.
 * Now accepts component source as strings instead of file paths.
 *
 * @param components - Array of component sources or entry file paths.
 * @param options - Compiler options containing build configuration.
 *
 * @returns The output files from the build process.
 */
const bundleSvelte = async (
  components: ComponentSource[] | string[] | string,
  options: CompilerOptions
): Promise<esbuild.OutputFile[] | undefined> => {
  // Handle backward compatibility with file paths
  if (typeof components === 'string' || (Array.isArray(components) && typeof components[0] === 'string')) {
    return bundleSvelteFromFiles(components as string[] | string, options);
  }

  const componentArray = Array.isArray(components) ? components : [components];
  
  if (options.debug) {
    console.log(`\nCompiling (${componentArray.length}) component${componentArray.length > 1 ? "s" : ""} from source...`);
  }

  // Create virtual file system plugin
  const virtualFilePlugin: esbuild.Plugin = {
    name: 'virtual-file',
    setup(build) {
      componentArray.forEach((component) => {
        const comp = component as ComponentSource;
        const filename = comp.filename || `${comp.name}.ts`;
        build.onResolve({ filter: new RegExp(`^virtual:${comp.name}$`) }, () => ({
          path: filename,
          namespace: 'virtual'
        }));
        
        build.onLoad({ filter: /.*/, namespace: 'virtual' }, (args) => {
          const matchingComponent = componentArray.find((c) => {
            const compSource = c as ComponentSource;
            const compFilename = compSource.filename || `${compSource.name}.ts`;
            return args.path === compFilename;
          }) as ComponentSource;
          
          return {
            contents: matchingComponent.source,
            loader: filename.endsWith('.svelte') ? 'ts' : 'ts'
          };
        });
      });
    }
  };

  const buildOptions: BuildOptions = {
    logLevel: options.debug ? "debug" : "info",
    entryPoints: componentArray.map(comp => `virtual:${(comp as ComponentSource).name}`),
    target: options.target,
    format: options.format as Format,
    splitting: false,
    packages: "external",
    banner: {
      js: options.banner
    },
    bundle: true,
    write: false, // Don't write to filesystem, return output files
    plugins: [
      virtualFilePlugin,
      esbuildSvelte({
        preprocess: sveltePreprocess(),
        compilerOptions: {
          css: "injected",
          preserveComments: true,
          preserveWhitespace: true
        }
      })
    ]
  };

  const build = await esbuild.build(buildOptions);
  return build.outputFiles;
};

/**
 * Bundle Svelte components from file paths (backward compatibility).
 */
const bundleSvelteFromFiles = async (
  entry: string[] | string,
  options: CompilerOptions
): Promise<esbuild.OutputFile[] | undefined> => {
  if (options.debug) {
    console.log(
      `\nCompiling (${Array.isArray(entry) ? entry.length : 1}) component${Array.isArray(entry) && entry.length > 1 ? "s" : ""} from files...`
    );
  }

  const buildOptions: BuildOptions = {
    logLevel: options.debug ? "debug" : "info",
    entryPoints: Array.isArray(entry) ? entry : [entry],
    target: options.target,
    format: options.format as Format,
    splitting: false,
    packages: "external",
    banner: {
      js: options.banner
    },
    bundle: true,
    outdir: options.output,
    plugins: [
      esbuildSvelte({
        preprocess: sveltePreprocess(),
        compilerOptions: {
          css: "injected",
          preserveComments: true,
          preserveWhitespace: true
        }
      })
    ]
  };

  const build = await esbuild.build(buildOptions);
  return build.outputFiles;
};

const argv = yargs(hideBin(process.argv))
  .option("debug", {
    alias: "d",
    type: "boolean",
    description: "Enable debug logging.",
    default: false
  })
  .option("input", {
    alias: "i",
    type: "string",
    description: "Input glob pattern for component entry files."
  })
  .demandOption("input")
  .option("output", {
    alias: "o",
    type: "string",
    description: "Path to output the compiled components."
  })
  .demandOption("output")
  .option("target", {
    alias: "t",
    type: "string",
    description: "Documentation: https://esbuild.github.io/api/#target",
    default: "esnext"
  })
  .option("format", {
    alias: "f",
    type: "string",
    description: "Documentation: https://esbuild.github.io/api/#format"
  })
  .choices("format", ["esm", "cjs"])
  .option("banner", {
    alias: "b",
    type: "string",
    description:
      "Banner text to add at the top of compiled files.\nExample:\n1 | // Compiled with esbuild-svelte 🕺\n2 | ..javascript output follows now..",
    default: ""
  })
  .example([
    ["compile --input=src/**/*.svelte --output=public"],
    [
      'compile --input=src/**/*.svelte --output=public --banner="// Compiled with esbuild-svelte" --debug'
    ]
  ])
  .version(false)
  .help(false)
  .wrap(Math.min(120, process.stdout.columns || 120))
  .parseSync();

console.log(`Searching for components with "${argv.input}"...`);

const entries = glob.sync(argv.input);

entries.forEach((entry) => {
  const t = template.replace(/NAME/g, "Tester");
  console.log(entry, t);
});

if (entries.length === 0) {
  console.error(`\nNo components found with "${argv.input}"`);
  process.exit(1);
}

console.log(`\nCompiling components...`);

const output = await bundleSvelte(entries, argv as CompilerOptions);

console.log(`\nCompiled ${output?.length} components.`);

// Export functions for programmatic use
export { bundleSvelte, bundleSvelteFromFiles, type ComponentSource, type CompilerOptions };

/**
 * Convenience function to compile a single component from source string.
 *
 * @param name - Component name
 * @param source - Component source code  
 * @param options - Compiler options
 * @returns The compiled output
 */
export const compileComponentFromSource = async (
  name: string,
  source: string,
  options: Omit<CompilerOptions, 'input'>
): Promise<esbuild.OutputFile[] | undefined> => {
  const component: ComponentSource = { name, source };
  return bundleSvelte([component], { ...options, input: '' });
};

/**
 * Compile multiple components from source strings.
 *
 * @param components - Array of component sources
 * @param options - Compiler options
 * @returns The compiled outputs
 */
export const compileComponentsFromSource = async (
  components: ComponentSource[],
  options: Omit<CompilerOptions, 'input'>
): Promise<esbuild.OutputFile[] | undefined> => {
  return bundleSvelte(components, { ...options, input: '' });
};
