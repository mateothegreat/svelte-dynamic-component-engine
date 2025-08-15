<script lang="ts">
  import { ComponentCompiler, type CompiledComponent } from "@mateothegreat/dynamic-component-engine";
  import { onMount } from "svelte";

  let renderRef: HTMLDivElement | undefined = $state(undefined);

  // This is to test that the component is updated when the count changes.
  let count = $state(0);
  setInterval(() => {
    count++;
  }, 1000);

  let instances: CompiledComponent[] = $state([]);

  const doWork = async () => {
    const source = `
    <script>
      import { onDestroy } from "svelte";
      
      let { count = $bindable(0), data } = $props();
      
      $effect(() => {
        console.log("count changed to:", count);
      });

      onDestroy(() => {
        console.log("I've been destroyed");
      });
    <\/script>

    <div class="m-4 p-4 border-2 border-pink-500 rounded">
      <p>data: <span class="text-pink-500">{data}</span></p>
      <p>count: <span class="text-pink-500">{count}</span></p>

      <button onclick={() => {
          count++;
      }} class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Increment
      <\/button>
    <\/div>`;

    const instance = await ComponentCompiler.render(
      source,
      renderRef!,
      {
        count,
        data: "passed at compile time"
      },
      {
        css: true,
        sourcemap: true,
        cache: false
      }
    );

    instances.push(instance);
  };

  const destroyComponent = () => {
    instances.forEach((instance) => instance.destroy());
    instances = [];
  };

  onMount(async () => {
    await doWork();
  });
</script>

<div class="m-4 flex flex-col gap-4">
  <div class="flex gap-4">
    <button class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onclick={doWork}> Create another Component </button>
    <button class="mt-4 px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600" onclick={destroyComponent}> Destroy Component </button>
  </div>

  <div bind:this={renderRef} class="border-4 border-slate-700 p-4 rounded">
    <!-- Dynamic component renders here -->
  </div>
</div>
