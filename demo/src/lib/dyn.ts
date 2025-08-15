import { compile } from "svelte/compiler";

export interface DynamicComponent {
  component: any;
  destroy: () => void;
}

export class SvelteDynamicRenderer {
  private static internalsScript: string | null = null;

  /**
   * Initialize by loading Svelte internals
   */
  static async initialize() {
    if (this.internalsScript) return;

    // Load Svelte internal modules
    const modules = ["svelte/internal/client", "svelte/internal/disclose-version"];

    const scripts = await Promise.all(
      modules.map(async (m) => {
        console.log(m);
        const response = await fetch(`https://esm.sh/svelte/internal`);
        return response.text();
      })
    );

    this.internalsScript = scripts.join("\n");
  }

  /**
   * Compile and render a Svelte component from source
   */
  static async render(source: string, target: HTMLElement, props?: Record<string, any>): Promise<DynamicComponent> {
    await this.initialize();

    // Compile the Svelte component
    const compiled = compile(source, {
      generate: "client",
      css: "injected",
      modernAst: true,
      runes: true,
      filename: "DynamicComponent.svelte"
    });

    // Create a self-contained module
    const moduleCode = `
      (function() {
        // Inject Svelte internals
        ${this.internalsScript}
        
        // Component code
        ${compiled.js.code}
        
        // Return the component
        return typeof Component !== 'undefined' ? Component : 
               typeof default !== 'undefined' ? default : 
               null;
      })()
    `;

    // Create and execute the module
    console.log(moduleCode);
    const ComponentConstructor = new Function("return " + moduleCode)();

    if (!ComponentConstructor) {
      throw new Error("Failed to compile component");
    }

    // Mount the component
    const instance = new ComponentConstructor({
      target,
      props
    });

    return {
      component: instance,
      destroy: () => {
        if (instance && typeof instance.$destroy === "function") {
          instance.$destroy();
        } else if (instance && typeof instance.destroy === "function") {
          instance.destroy();
        }
      }
    };
  }
}
