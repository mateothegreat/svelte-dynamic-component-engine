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
