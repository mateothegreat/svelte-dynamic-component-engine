// I'm compiled from entry.ts which imports simple.svelte using esbuild-svelte.

// src/components/entry.ts
import { mount, unmount } from "svelte";

// src/components/simple.svelte
import "svelte/internal/disclose-version";
import * as $ from "svelte/internal/client";
var on_click = (_, testState) => $.update(testState);
var root = $.from_html(`<div> </div> <button> </button>`, 1);
function Simple($$anchor, $$props) {
  let testState = $.state(0);
  var fragment = root();
  var div = $.first_child(fragment);
  var text = $.child(div);
  $.reset(div);
  var button = $.sibling(div, 2);
  button.__click = [on_click, testState];
  var text_1 = $.child(button, true);
  $.reset(button);
  $.template_effect(() => {
    $.set_text(text, `name from $props(): ${$$props.name ?? ""}`);
    $.set_text(text_1, $.get(testState));
  });
  $.append($$anchor, fragment);
}
$.delegate(["click"]);

// src/components/entry.ts
var factory = (target, props) => {
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
export {
  factory as default
};
