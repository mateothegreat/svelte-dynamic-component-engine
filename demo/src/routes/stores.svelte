<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import { unregister } from "$lib/registry.svelte";
  import { ComponentCompiler, type CompiledComponent } from "@mateothegreat/dynamic-component-engine";
  import { onDestroy, onMount, type Component } from "svelte";
  import { writable } from "svelte/store";

  let renderRef: HTMLDivElement | undefined = $state(undefined);
  let instance: CompiledComponent | undefined = $state(undefined);
  let RenderableComponent = $state<Component | null>(null);
  let instances: CompiledComponent[] = $state([]);

  const s = writable({ count: 0 });
  let count = $derived(s);

  // s.subscribe((value) => {
  //   count = value.count;
  //   console.log("Initial props:", s, value, count);
  // });

  const doWork = async () => {
    const source = `
    <script>
      import { onDestroy } from "svelte";
      import Button from "$lib/components/ui/button/button.svelte";

      let { id, s } = $props();

      let count = $derived(s.count);

      s.subscribe((value) => {
        count = value.count;
        console.log("Initial props:", s, value, count);
      });

      $effect(() => {
        console.log("count", count);
      });

      const update = (props) => {
        console.log("dynamic component update() triggered", props);
      };

      const incrementCount = () => {
        s.update((prev) => ({ ...prev, count: prev.count + 1 }));
        console.log("Incremented from inside, new value:", s.count);
      };
    <\/script>

    <div class="flex flex-col gap-2 m-4 p-4 border-2 border-sky-700 rounded bg-gray-800/35 text-sm">
      <div class="">
        <span class="text-sm text-fuchsia-500 font-bold">{id}</span>
        <span class="text-sm text-slate-500">(dynamically rendered component)</span>
      </div>
      <div class="">
        <p>Count: <span class="text-green-400">{count}</span></p>
        <button onclick={incrementCount} class="mt-4 px-2 text-sm py-1 bg-blue-500 text-slate-200 rounded hover:bg-blue-600">
          s.count++ (from inside)
        </button>
      </div>
    </div>`;

    const id = Math.random().toString(36).substring(2, 15);
    const compiled = ComponentCompiler.compile(source);
    console.log(compiled);
    const loaded = await ComponentCompiler.load(compiled.js.code);
    console.log(loaded);
    console.log(
      await ComponentCompiler.render(id, source, renderRef!, {
        id,
        s
      })
    );

    // const transformed = ComponentCompiler.wrap(compiled.js.code);
    // const fn = await ComponentCompiler.load(transformed.data);
    // const component = fn(renderRef!, {
    //   id,
    //   p,
    //   count: p.count
    // });

    // RenderableComponent = fn().component;

    // console.log(RenderableComponent);

    let interval = setInterval(() => {
      s.update((prev) => ({ ...prev, count: prev.count + 1 }));
    }, 750);
  };

  const destroyComponent = () => {
    instances.forEach((instance) => {
      console.log("runes-registry: destroying component:", instance.id);
      instance.destroy();
      unregister(instance.id);
    });
    instances = [];
    if (renderRef) {
      renderRef.innerHTML = "";
    }
  };

  onMount(async () => {
    await doWork();
  });

  onDestroy(() => {
    destroyComponent();
  });
</script>

<div class="flex flex-col gap-2 m-4">
  <h1 class="text-2xl font-bold">Shared Store</h1>
  <p class="text-sm text-slate-400">The store is updated every 750ms and the component automatically reflects the new value.</p>
  <div class="flex flex-col gap-4">
    <div class="flex gap-4">
      <Button onclick={doWork}>Create another Component</Button>
      <Button onclick={destroyComponent} variant="destructive">Destroy all Components</Button>
    </div>
    <div class="flex bg-gray-800/20 p-1.5 px-2 rounded border-2 border-gray-800/50">
      <div class="flex items-center justify-center gap-2">
        <div class="text-sm text-slate-500">
          (outside)
          <span class="font-bold text-indigo-400">count</span>
          :
        </div>
        <div class="text-green-500 bg-gray-800 rounded px-2 text-sm font-bold">{count}</div>
        <Button size="sm" variant="outline" onclick={() => s.update((prev) => ({ ...prev, count: prev.count + 1 }))}>Increment</Button>
      </div>
    </div>
    <div bind:this={renderRef} class="p-4 rounded border-2 border-gray-800 bg-gray-800/20"></div>
  </div>
</div>
