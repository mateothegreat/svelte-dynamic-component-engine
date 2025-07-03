import { mount, tick, unmount } from "svelte";
import { compile, type CompileResult } from "svelte/compiler";

/**
 * Configuration options for dynamic component compilation and mounting.
 */
export interface DynamicComponentOptions {
  /** The Svelte component source code as a string */
  componentSource: string;
  /** The target DOM element where the component should be mounted */
  target: HTMLElement;
  /** Optional filename for the component (used in error messages) */
  filename?: string;
  /** Optional props to pass to the component */
  props?: Record<string, any>;
  /** Whether to enable Svelte 5 runes (default: true) */
  runes?: boolean;
}

/**
 * Result of dynamic component creation.
 */
export interface DynamicComponentResult {
  /** The instantiated Svelte component */
  component: any;
  /** Function to destroy the component and clean up resources */
  destroy: () => void;
  /** The compiled CSS (if any) */
  css?: string;
}

/**
 * Error thrown when dynamic component compilation or mounting fails.
 */
export class DynamicComponentError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
    public readonly stage?: 'compilation' | 'instantiation' | 'mounting'
  ) {
    super(message);
    this.name = 'DynamicComponentError';
  }
}

// Cache for compiled components to avoid recompilation
const componentCache = new Map<string, any>();

/**
 * Creates a unique cache key for a component source
 */
function createCacheKey(source: string, options: { runes?: boolean }): string {
  return `${source}_runes:${options.runes ?? true}`;
}

/**
 * Creates and mounts a Svelte component dynamically from source code.
 * 
 * This function compiles the provided Svelte component source code at runtime
 * and mounts it to the specified target element. It handles CSS injection,
 * component instantiation, and cleanup.
 * 
 * @param options - Configuration options for component creation
 * @returns Promise resolving to the component result with destroy method
 * 
 * @throws {DynamicComponentError} When compilation or mounting fails
 * 
 * @example
 * ```ts
 * const result = await createDynamicComponent({
 *   componentSource: `
 *     <script>
 *       let count = $state(0);
 *     </script>
 *     <button onclick={() => count++}>Count: {count}</button>
 *   `,
 *   target: document.getElementById('container')!
 * });
 * 
 * // Later, clean up
 * result.destroy();
 * ```
 */
export async function createDynamicComponent(
  options: DynamicComponentOptions
): Promise<DynamicComponentResult> {
  const {
    componentSource,
    target,
    filename = "DynamicComponent.svelte",
    props = {},
    runes = true,
  } = options;

  // Validate inputs
  if (!componentSource?.trim()) {
    throw new DynamicComponentError(
      "Component source cannot be empty",
      undefined,
      'compilation'
    );
  }

  if (!target || !(target instanceof HTMLElement)) {
    throw new DynamicComponentError(
      "Target must be a valid HTMLElement",
      undefined,
      'mounting'
    );
  }

  let compiledResult: CompileResult;
  let cssStyleElement: HTMLStyleElement | null = null;
  let componentInstance: any = null;

  try {
    // Check cache first
    const cacheKey = createCacheKey(componentSource, { runes });
    let ComponentConstructor = componentCache.get(cacheKey);
    
    if (!ComponentConstructor) {
      // Compile the Svelte component
      compiledResult = compile(componentSource, {
        filename,
        generate: "client",
        css: "external",
        runes,
        dev: true, // Enable dev mode for better error messages
      });

      // Create a component constructor using eval with proper context
      // This approach ensures the code has access to Svelte's runtime
      const componentCode = `
        (function() {
          const exports = {};
          const module = { exports };
          
          ${compiledResult.js.code}
          
          return module.exports.default || module.exports || exports.default || exports;
        })()
      `;

      // Use eval to create the component in the current context
      // This ensures it has access to all imported Svelte runtime functions
      try {
        console.log("componentCode", componentCode);
        ComponentConstructor = eval(componentCode);
        
        // Cache the compiled component
        componentCache.set(cacheKey, ComponentConstructor);
      } catch (evalError) {
        throw new DynamicComponentError(
          `Failed to evaluate compiled component: ${evalError instanceof Error ? evalError.message : String(evalError)}`,
          evalError,
          'instantiation'
        );
      }

      // Handle CSS if present
      if (compiledResult.css?.code) {
        cssStyleElement = document.createElement("style");
        cssStyleElement.textContent = compiledResult.css.code;
        cssStyleElement.setAttribute("data-dynamic-component", filename);
        document.head.appendChild(cssStyleElement);
      }
    }

    if (!ComponentConstructor) {
      throw new DynamicComponentError(
        "Failed to create component constructor",
        undefined,
        'instantiation'
      );
    }

    // Mount the component using Svelte 5's mount function
    componentInstance = mount(ComponentConstructor, {
      target,
      props,
    });

    // Wait for the component to be fully rendered
    await tick();

  } catch (error) {
    // Clean up on error
    if (cssStyleElement) {
      cssStyleElement.remove();
    }

    if (error instanceof DynamicComponentError) {
      throw error;
    }

    // Determine error stage based on the error type
    let stage: 'compilation' | 'instantiation' | 'mounting' = 'compilation';
    if (error instanceof TypeError && error.message.includes('Component')) {
      stage = 'instantiation';
    } else if (error instanceof Error && error.message.includes('target')) {
      stage = 'mounting';
    }

    throw new DynamicComponentError(
      `Failed to create dynamic component: ${error instanceof Error ? error.message : String(error)}`,
      error,
      stage
    );
  }

  // Return the result with cleanup function
  return {
    component: componentInstance,
    css: compiledResult?.css?.code,
    destroy: () => {
      try {
        if (componentInstance) {
          unmount(componentInstance);
        }
      } catch (error) {
        console.warn('Error destroying component:', error);
      }

      if (cssStyleElement) {
        cssStyleElement.remove();
      }
    },
  };
}

/**
 * Validates Svelte component source code for common syntax errors.
 * 
 * @param source - The component source code to validate
 * @returns Object with validation result and any errors found
 */
export function validateComponentSource(source: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!source?.trim()) {
    errors.push("Component source cannot be empty");
    return { isValid: false, errors };
  }

  // Remove HTML comments to avoid false positives
  const sourceWithoutComments = source.replace(/<!--[\s\S]*?-->/g, '');

  // Basic syntax validation - check for properly balanced script tags
  const scriptOpens = (sourceWithoutComments.match(/<script[^>]*>/g) || []).length;
  const scriptCloses = (sourceWithoutComments.match(/<\/script>/g) || []).length;
  
  if (scriptOpens !== scriptCloses) {
    errors.push("Mismatched <script> tags");
  }

  // Check for properly balanced style tags
  const styleOpens = (sourceWithoutComments.match(/<style[^>]*>/g) || []).length;
  const styleCloses = (sourceWithoutComments.match(/<\/style>/g) || []).length;
  
  if (styleOpens !== styleCloses) {
    errors.push("Mismatched <style> tags");
  }

  // Check for basic rune usage if present
  if (source.includes('$state') || source.includes('$derived') || source.includes('$effect')) {
    if (!source.includes('<script>') && !source.includes('<script ')) {
      errors.push("Runes require a <script> block");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Creates a simple error display component for failed dynamic components.
 * 
 * @param error - The error to display
 * @param target - The target element to mount the error display
 */
export function createErrorDisplay(error: Error, target: HTMLElement): void {
  target.innerHTML = `
    <div style="
      background: #fee2e2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      padding: 16px;
      color: #991b1b;
      font-family: monospace;
      font-size: 14px;
      white-space: pre-wrap;
    ">
      <strong>Dynamic Component Error:</strong><br>
      ${error.message}
      ${error.cause ? `\n\nCause: ${error.cause}` : ''}
    </div>
  `;
}

/**
 * Clears the component cache. Useful for development or when components need to be recompiled.
 */
export function clearComponentCache(): void {
  componentCache.clear();
}