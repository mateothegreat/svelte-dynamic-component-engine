import { load, render, type Rendered } from "./dynamic-components";

export const loadComponent = async <T>(renderRef: HTMLElement, props: T): Promise<Rendered<T>> => {
  const source = await fetch("/entry.js").then((res) => res.text());
  const fn = await load(source);

  /**
   * We pass type type to the render function to infer the type of the props for the
   * component. This is useful because we can then use the props type for accessing the
   * props of the renderedcomponent.
   */
  const component = await render<T>(fn, {
    source: source,
    target: renderRef!,
    props: props
  });

  return component;
};
