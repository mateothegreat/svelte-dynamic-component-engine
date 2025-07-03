import { Logger, LogLevel } from "./logger";
/**
 * The logger for the dynamic-components module.
 */
const logger = new Logger("dynamic-components.ts", { level: LogLevel.DEBUG });
/**
 * Load a component from a string of compiled component source code as an esm module.
 *
 * @param {string} source The component source code as a string.
 *
 * @returns {Promise<Function>} The instantiated component function.
 */
export const load = async (source) => {
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
export const render = async (fn, options) => {
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
//# sourceMappingURL=dynamic-components.js.map