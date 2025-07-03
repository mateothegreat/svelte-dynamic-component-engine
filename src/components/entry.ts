import { mount, unmount } from "svelte";
import type { Rendered } from "../lib/dynamic-components";
import Simple from "./simple.svelte";

const factory = (target: HTMLElement, props?: Record<string, never>): Rendered => {
  const component = mount(Simple, { target, props });
  return {
    component,
    name: Simple.name,
    destroy: () => {
      console.log("entry.ts -> simple.svelte", "destroying component", component);
      unmount(component);
    }
  };
};

export { factory as default };
