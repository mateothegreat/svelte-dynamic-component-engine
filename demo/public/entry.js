// I'm compiled from entry.ts which imports simple.svelte using esbuild-svelte.

// src/components/entry.ts
import { mount, unmount } from "svelte";

// src/components/simple.svelte
import "svelte/internal/disclose-version";
import * as $ from "svelte/internal/client";
var on_click = (_, testState) => $.update(testState);
var root = $.from_html(
  `

<div class="border-3 flex w-[600px] flex-col gap-4 rounded-md border-slate-500 bg-zinc-600/20 p-5">
  <div class="flex flex-col gap-2">
    <p class="text-lg font-semibold text-pink-500">Simple Component</p>
    <p class="text-sm font-medium text-slate-500">This is a simple component that is rendered on the receiving side.<br/>See the <a href="https://github.com/mateothegreat/svelte-dynamic-component-engine/blob/main/demo/src/components/simple.svelte" class="text-green-400"> source code </a> for more details.</p>
  </div>
  <div class="border-3 mt-4 flex items-center gap-2 rounded-md border-slate-500/50 p-2 px-4">
    <span class="text-lg font-medium text-slate-500">\`name\` from $props():</span>
    <span class="text-lg font-medium text-green-400"> </span>
  </div>
  <div class="border-3 flex items-center gap-2 rounded-md border-slate-500/50 p-2 px-4">
    <span class="text-lg font-medium text-slate-500">testState:</span>
    <span class="text-lg font-medium text-green-400"> </span>
  </div>
  <button class="mt-4 cursor-pointer rounded-md border-none bg-green-600 p-2 text-white transition-all duration-300 hover:bg-green-700 active:scale-95 active:bg-green-800">
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
  var div_1 = $.sibling($.child(div), 3);
  var span = $.sibling($.child(div_1), 3);
  var text = $.child(span);
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
    $.set_text(text, `"${$$props.name ?? ""}"`);
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
