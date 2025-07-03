import { mount, unmount } from "svelte";
import Simple from "./simple.svelte";
/**
 * The factory function is used to create a new instance of the component
 * when being rendered on the receiving side.
 *
 * This is important because it allows us to have granular control over the component
 * lifecycle and not require the receiving side to bear that burden.
 *
 * @param {HTMLElement} target The target element to mount the component on.
 * @param {SimpleProps} props The props to pass to the component.
 *
 * @returns {Rendered<SimpleProps>} A Rendered object that contains the component, name, props, and destroy function.
 */
const factory = (target, props) => {
    const component = mount(Simple, {
        target,
        props: props
    });
    return {
        component,
        name: "Simple",
        props: props,
        destroy: () => {
            console.log("entry.ts -> simple.svelte", "destroying component", component);
            unmount(component);
        }
    };
};
/**
 * Export the factory function as the default export to make it easier
 * on the receiving side performing the dynamic import.
 */
export { factory as default };
//# sourceMappingURL=entry.js.map