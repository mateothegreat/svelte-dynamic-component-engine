import type { mount } from "svelte";
import { Logger, LogLevel } from "./logger";

/**
 * The logger for the dynamic-components module.
 */
const logger = new Logger("dynamic-components.ts", { level: LogLevel.DEBUG });

/**
 * The type of the component instance returned by the `mount` function.
 *
 * @template T The type of the props of the component.
 */
export type RenderableComponent<T> = ReturnType<typeof mount>;

/**
 * The result of a rendered component.
 *
 * @template TProps The type of the props of the component.
 */
export type Rendered<TProps> = {
  /** The name of the component */
  name: string;
  /** The component instance */
  component: RenderableComponent<TProps>;
  /** The props of the component */
  props: TProps;
  /** Destroy the component */
  destroy: () => void;
};

/**
 * Configuration options for loading and rendering a component.
 *
 * @template TProps The type of the props of the component.
 */
export interface RenderOptions<TProps> {
  /** The component source code as a string */
  source: string;
  /** The target DOM element where the component should be mounted */
  target: HTMLElement;
  /** Optional props to pass to the component */
  props: TProps;
}

/**
 * Load a component from a string of compiled component source code as an esm module.
 *
 * @param {string} source The component source code as a string.
 *
 * @returns {Promise<Function>} The instantiated component function.
 */
export const load = async (source: string): Promise<Function> => {
  const url = URL.createObjectURL(new Blob([source], { type: "application/javascript" }));
  const module = await import(/* @vite-ignore */ url);
  return module.default;
};

/**
 * Render a component and mount it at the target element.
 *
 * @param {Function} fn The component function to render.
 * @param {RenderOptions<TProps>} options The options for the component.
 *
 * @returns {Promise<Rendered<TProps>>} The rendered component.
 */
export const render = async <TProps>(fn: Function, options: RenderOptions<TProps>): Promise<Rendered<TProps>> => {
  const component = fn(options.target, options.props);
  return {
    name: component.name,
    component: component,
    props: options.props,
    destroy: () => {
      component.destroy();
    }
  };
};
