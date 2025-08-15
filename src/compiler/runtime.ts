import { compile, type CompileOptions, type CompileResult } from "svelte/compiler";

export interface CompiledComponent {
  component: any;
  destroy: () => void;
  update: (props: Record<string, any>) => void;
  result?: {
    name?: string;
    filename?: string;
    hasCSS?: boolean;
    length: number;
  };
}

export interface CompilerOptions {
  css?: boolean;
  sourcemap?: boolean;
  name?: string;
  cache?: boolean;
  onMount?: (component: any) => void;
  onDestroy?: () => void;
  onError?: (error: Error) => void;
  useSandbox?: boolean; // Optional: render inside iframe for isolation
}

/**
 * Runtime compiler for Svelte 5 components with reactive props and optional sandboxing.
 * Compiles Svelte source strings into live components using mount/unmount APIs.
 */
export class ComponentCompiler {
  private static componentCache = new Map<string, Function>();

  /**
   * Dynamically load compiled JavaScript as an ES module.
   * Uses Blob URLs to simulate module imports at runtime.
   *
   * @param source - Transformed JavaScript code.
   *
   * @returns The component factory function.
   */
  private static async loadModule(source: string): Promise<Function> {
    const blob = new Blob([source], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    try {
      const module = await import(/* @vite-ignore */ url);
      URL.revokeObjectURL(url);
      return module.default;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Compile Svelte source code into JavaScript using Svelte 5 compiler.
   *
   * @param source - Svelte component source.
   * @param options - Compiler options.
   *
   * @returns CompileResult containing JS and CSS.
   */
  private static compileSource(source: string, options: CompilerOptions = {}): CompileResult {
    const compileOptions: CompileOptions = {
      generate: "client",
      css: options.css ? "injected" : "external",
      // If true, returns the modern version of the AST. Will become true by default in Svelte 6, and the option will be removed in Svelte 7.
      modernAst: true,
      // Set to true to force the compiler into runes mode, even if there are no indications of runes usage. Set to false to force the compiler into ignoring runes, even if there are indications of runes usage. Set to undefined (the default) to infer runes mode from the component code. Is always true for JS/TS modules compiled with Svelte. Will be true by default in Svelte 6. Note that setting this to true in your svelte.config.js will force runes mode for your entire project, including components in node_modules, which is likely not what you want. If you're using Vite, consider using dynamicCompileOptions instead.
      runes: true,
      filename: options.name || "DynamicComponent.svelte"
    };

    return compile(source, compileOptions);
  }

  /**
   * Transforms compiled JS to wrap the component in a factory using mount/unmount to
   * enable lifecycle control and prop injection.
   *
   * @param code - Compiled JS code.
   * @param componentName - Name of the component.
   *
   * @returns Transformed JS code as string.
   */
  private static transformCompiledCode(code: string, componentName: string): string {
    const lines = code.split("\n");

    /**
     * Inject mount and unmount imports so that the wrapper can do it's job.
     */
    lines.unshift(`import { mount, unmount } from "svelte";`);

    /**
     * Replace default export with named component so that when the component is rendered,
     * the component is not exported as default but as a named component.
     */
    const exportDefault = lines.findIndex((line) => line.startsWith("export default"));
    if (exportDefault !== -1) {
      const line = lines[exportDefault];
      if (line) {
        lines[exportDefault] = line.replace(/export default\s+/, `const ${componentName} = `);
      }
    }

    /**
     * This is to wrap the component in a factory function so that we can:
     * 1. Create a new instance of the component.
     * 2. Mount the component into the target element.
     * 3. Return the component and the destroy function.
     */
    lines.push(`
      const factory = (target, props) => {
        const component = mount(${componentName}, { target, props });
        return {
          component,
          destroy: () => unmount(component)
        };
      };
      export { factory as default };
    `);

    return lines.join("\n");
  }

  /**
   * Renders a compiled component into a target DOM element.
   *
   * @param source - Svelte source code.
   * @param target - DOM element to mount into.
   * @param props - Initial props.
   * @param options - Compiler and lifecycle options.
   *
   * @returns A compiled component instance.
   */
  static async render(
    source: string,
    target: HTMLElement,
    props: Record<string, any> = {},
    options: CompilerOptions = {}
  ): Promise<CompiledComponent> {
    try {
      const cacheKey = source + JSON.stringify(options);
      let fn: Function | undefined;

      if (options.cache) {
        fn = this.componentCache.get(cacheKey);
      }

      const compiled = this.compileSource(source, options);
      /**
       * Strip the file extension from the name.
       *
       * This is to prevent the following error (the name of function is not valid because of the dot):
       * ```ts
       * const DynamicComponent.svelte = function DynamicComponent($$anchor, $$props) {
       * SyntaxError: Missing initializer in const declaration (at 21242b81-0fce-4eb9-8a92-d21cf4e83631:11:7)
       * ```
       */
      const componentName = options.name?.replace(/\.(svelte|js)$/, "") || "DynamicComponent";
      const transformedCode = this.transformCompiledCode(compiled.js.code, componentName);

      fn = await this.loadModule(transformedCode);
      this.componentCache.set(cacheKey, fn);

      const instance = fn(target, props);

      const component = {
        component: instance.component,
        destroy: () => {
          instance.destroy();
          target.innerHTML = "";
          options.onDestroy?.();
        },
        update: (props: Record<string, any>) => {
          console.log("needs to propagate the update to the component", props);
          // instance.update(props);
        },
        result: {
          name: componentName,
          filename: options.name,
          hasCSS: !!compiled.css,
          length: compiled.js.code.length
        }
      };

      /**
       * If the caller provides an onMount callback, call it with the component instance
       * so that the caller can do something with the newcomponent instance.
       */
      options.onMount?.(instance.component);

      return component;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      options.onError?.(err);
      throw err;
    }
  }

  /**
   * Clears the internal component cache.
   */
  static clearCache(): void {
    this.componentCache.clear();
  }
}
