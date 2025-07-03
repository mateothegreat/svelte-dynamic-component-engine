import type { Rendered } from "@mateothegreat/dynamic-component-engine";
import { mount, unmount, type ComponentProps } from "svelte";
import Simple from "./simple.svelte";

/**
 * Handy type alias for the props of the Simple component that can
 * be used all over and anywhere.
 */
export type SimpleProps = ComponentProps<typeof Simple>;

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
const factory = (target: HTMLElement, props?: SimpleProps): Rendered<SimpleProps> => {
  const component = mount(Simple, {
    target,
    props: props as SimpleProps
  });

  return {
    component,
    name: "Simple",
    props: props as SimpleProps,
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
