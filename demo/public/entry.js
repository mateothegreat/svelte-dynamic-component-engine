// I'm compiled from entry.ts which imports simple.svelte using esbuild-svelte.

// src/components/entry.ts
import { mount, unmount } from "svelte";

// src/components/simple.svelte
import "svelte/internal/disclose-version";
import * as $ from "svelte/internal/client";
var on_click = (_, testState) => $.update(testState);
var root = $.from_html(
  `

<div class="border-3 flex flex-col gap-4 rounded-md border-slate-500 p-4">
  <div class="border-3 flex items-center gap-2 rounded-md border-green-500 p-2 px-4">
    <span class="text-lg font-medium text-slate-500">name from $props():</span>
    <span class="text-lg font-medium text-green-400"> </span>
  </div>
  <div class="border-3 flex items-center gap-2 rounded-md border-green-500 p-2 px-4">
    <span class="text-lg font-medium text-slate-500">testState:</span>
    <span class="text-lg font-medium text-green-400"> </span>
  </div>
  <button class="cursor-pointer rounded-md border-none bg-green-600 p-2 text-white transition-all duration-300 hover:bg-green-700 active:scale-95 active:bg-green-800">
    <span class="text-lg font-medium">\u{1F525} increment testState</span>
  </button>
</div>`,
  1
);
function Simple($$anchor, $$props) {
  "use strict";
  let testState = $.state(1);
  $.next();
  var fragment = root();
  var div = $.sibling($.first_child(fragment));
  var div_1 = $.sibling($.child(div));
  var span = $.sibling($.child(div_1), 3);
  var text = $.child(span, true);
  $.reset(span);
  $.next();
  $.reset(div_1);
  var div_2 = $.sibling(div_1, 2);
  var span_1 = $.sibling($.child(div_2), 3);
  var text_1 = $.child(span_1, true);
  $.reset(span_1);
  $.next();
  $.reset(div_2);
  var button = $.sibling(div_2, 2);
  button.__click = [on_click, testState];
  $.next();
  $.reset(div);
  $.template_effect(() => {
    $.set_text(text, $$props.name);
    $.set_text(text_1, $.get(testState));
  });
  $.append($$anchor, fragment);
}
$.delegate(["click"]);

// src/components/entry.ts
var factory = (target, props) => {
  const component = mount(Simple, {
    target,
    props
  });
  return {
    component,
    name: "Simple",
    props,
    destroy: () => {
      console.log("entry.ts -> simple.svelte", "destroying component", component);
      unmount(component);
    }
  };
};
export {
  factory as default
};
