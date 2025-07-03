# Dynamic Component Engine

A powerful, secure, and flexible runtime component compiler for Svelte 5+ applications.

## ✨ Features

- **Runtime Component Compilation**: Transform Svelte component strings into fully functional components on the fly.
- **Type Safety**: Comprehensive TypeScript support with detailed interfaces and type definitions.
- **Svelte 5 Ready**: Full support for Svelte 5 runes and the latest features.

## 🚀 Quick Start

### Installation

```bash
npm install @mateothegreat/dynamic-component-engine svelte
```

### Usage

First, you need to update your `index.html` to include the following importmap:

```html
<script type="importmap">
  {
    "imports": {
      "svelte": "https://esm.sh/svelte@5.35.1",
      "svelte/internal/disclose-version": "https://esm.sh/svelte@5.35.1/internal/disclose-version",
      "svelte/internal/": "https://esm.sh/svelte@5.35.1/internal/"
    }
  }
</script>
```

> [!NOTE]
> This is necessary to ensure that the Svelte runtime is available to the dynamic component engine.
> See [index.html](../index.html) for a working implementation.

### Example

Here's an example of how to use the dynamic component engine to render a component from a remote source (in this case, a locally compiled Svelte component served by vite):

```svelte
<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import {
    load,
    render,
    type Rendered
  } from "@mateothegreat/dynamic-component-engine";

  let renderRef: HTMLDivElement;
  let component: Rendered;

  async function create() {
    try {
      const source = await fetch(
        "https://dynamic-component-engine.matthewdavis.io/entry.js"
      ).then((res) => res.text());
      const fn = await load(source);
      component = await render(fn, {
        componentSource: source,
        target: renderRef,
        props: {
          foo: "bar"
        }
      });
    } catch (error) {
      console.error(error);
    }
  }

  onMount(async () => {
    create();
  });

  onDestroy(() => {
    component.destroy();
  });
</script>

<div bind:this={renderRef}></div>
```

## 🔨 Compiling a Svelte Component

You must first compile your Svelte component(s) down to a string and serve it to the client (http endpoint, websockets, etc.) then you can use the `load` and `render` functions to dynamically render the component(s) in the browser.

### `esbuild-svelte`

```typescript
import esbuild from "esbuild";
import esbuildSvelte from "esbuild-svelte";
import { sveltePreprocess } from "svelte-preprocess";

async function bundleSvelte(entry) {
  const build = await esbuild.build({
    logLevel: "debug",
    entryPoints: Array.isArray(entry) ? entry : [entry],
    target: "esnext",
    format: "esm",
    splitting: false,
    packages: "external",
    banner: {
      js: "// I'm compiled from entry.ts which imports simple.svelte using esbuild-svelte."
    },
    bundle: true,
    outdir: "./public",
    plugins: [
      esbuildSvelte({
        preprocess: sveltePreprocess()
      })
    ]
  });

  return build.outputFiles;
}

bundleSvelte(["./src/components/entry.ts"]);
```

Now you're ready to compile your svelte component(s) down to an esm module:

```bash
node build.js
```

Should show something like this in your terminal:

```shell
$ node build.js

  public/entry.js  1.2kb

⚡ Done in 156ms
```

### Output

After running `node build.js` the output will be a single file in the `public` directory and will look like this:

```js
const compiledComponentSource = `
// I'm compiled from entry.ts which imports simple.svelte using esbuild-svelte.
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/components/entry.ts
import { mount, unmount } from "svelte";

// src/components/simple.svelte
import "svelte/internal/disclose-version";
import * as $ from "svelte/internal/client";
var on_click = /* @__PURE__ */ __name((_, testState) => $.update(testState), "on_click");
var root = $.from_html(`<div></div> <button> </button>`, 1);
function Simple($$anchor) {
  let name = "I'm but a simple component";
  let testState = $.state(0);
  var fragment = root();
  var div = $.first_child(fragment);
  var button = $.sibling(div, 2);
  button.__click = [on_click, testState];
  var text = $.child(button, true);
  $.reset(button);
  $.template_effect(() => $.set_text(text, $.get(testState)));
  $.append($$anchor, fragment);
}
__name(Simple, "Simple");
$.delegate(["click"]);

// src/components/entry.ts
var factory = /* @__PURE__ */ __name((target, props) => {
  const component = mount(Simple, { target, props });
  return {
    component,
    name: Simple.name,
    destroy: /* @__PURE__ */ __name(() => {
      console.log("entry.ts -> simple.svelte", "destroying component", component);
      unmount(component);
    }, "destroy")
  };
}, "factory");
export {
  factory as default
};
`;
```

## 🤝 Contributing

We welcome contributions! Whether it's bug reports, feature requests, or pull requests, all contributions are appreciated.

## 📜 License

MIT License - feel free to use in personal and commercial projects.

---

Built with ❤️ from Texas for the Svelte community.
