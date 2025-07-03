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
  let blobUrl: string | null = null;

  try {
    // Compile the Svelte component
    // Using 'external' CSS to avoid runtime CSS injection issues
    compiledResult = compile(componentSource, {
      filename,
      generate: "client",
      css: "external",
      runes,
      dev: true, // Enable dev mode for better error messages
    });

    // Handle CSS if present
    if (compiledResult.css?.code) {
      cssStyleElement = document.createElement("style");
      cssStyleElement.textContent = compiledResult.css.code;
      cssStyleElement.setAttribute("data-dynamic-component", filename);
      document.head.appendChild(cssStyleElement);
    }

    // Create the component module with proper imports
    const moduleCode = `
      import { SvelteComponent, createRoot, mount, unmount } from 'svelte/internal';
      ${compiledResult.js.code}
      export default DynamicComponent;
    `.trim();

    // Create blob URL and import the module
    const blob = new Blob([moduleCode], { type: "application/javascript" });
    blobUrl = URL.createObjectURL(blob);

    const componentModule = await import(/* @vite-ignore */ blobUrl);
    const ComponentClass = componentModule.default;

    if (!ComponentClass) {
      throw new DynamicComponentError(
        "Failed to extract component class from compiled module",
        undefined,
        'instantiation'
      );
    }

    // Mount the component using Svelte 5's mount function
    componentInstance = new ComponentClass({
      target,
      props,
    });

  } catch (error) {
    // Clean up on error
    if (cssStyleElement) {
      cssStyleElement.remove();
    }
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
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
    css: compiledResult.css?.code,
    destroy: () => {
      try {
        if (componentInstance && typeof componentInstance.$destroy === 'function') {
          componentInstance.$destroy();
        }
      } catch (error) {
        console.warn('Error destroying component:', error);
      }

      if (cssStyleElement) {
        cssStyleElement.remove();
      }

      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
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

  // Basic syntax validation
  const scriptMatches = source.match(/<script[^>]*>/g);
  const scriptCloses = source.match(/<\/script>/g);
  
  if (scriptMatches && scriptCloses && scriptMatches.length !== scriptCloses.length) {
    errors.push("Mismatched <script> tags");
  }

  const styleMatches = source.match(/<style[^>]*>/g);
  const styleCloses = source.match(/<\/style>/g);
  
  if (styleMatches && styleCloses && styleMatches.length !== styleCloses.length) {
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