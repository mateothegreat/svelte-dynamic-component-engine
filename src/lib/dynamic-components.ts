import { Logger, LogLevel } from "./logger";

const logger = new Logger("dynamic-components.ts", { level: LogLevel.DEBUG });

/**
 * Result of rendering a component.
 */
export type Rendered = {
  /** The name of the component */
  name: string;
  /** The component instance */
  component: Record<string, never>;
  /** Destroy the component */
  destroy: () => void;
};

/**
 * Configuration options for dynamic component loading and rendering.
 */
export interface RenderOptions {
  /** The Svelte component source code as a string */
  componentSource: string;
  /** The target DOM element where the component should be mounted */
  target: HTMLElement;
  /** Optional filename for the component (used in error messages) */
  filename?: string;
  /** Optional props to pass to the component */
  props?: Record<string, unknown>;
  /** Whether to enable Svelte 5 runes (default: true) */
  runes?: boolean;
}

/**
 * Load a component from a string of Svelte component source code.
 *
 * @param source - The Svelte component source code as a string.
 * @returns The instantiated component function.
 */
export const load = async (source: string): Promise<Function> => {
  const url = URL.createObjectURL(new Blob([source], { type: "application/javascript" }));
  const module = await import(/* @vite-ignore */ url);
  return module.default;
};

/**
 * Render a component to a DOM element.
 *
 * @param fn - The component function to render.
 * @param options - The options for the component.
 * @returns The rendered component.
 */
export const render = async (fn: Function, options: RenderOptions): Promise<Rendered> => {
  const component = fn(options.target, options.props);
  return {
    name: component.name,
    component: component,
    destroy: () => {
      component.destroy();
    }
  };
};
