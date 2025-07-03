<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import { Toaster } from "$lib/components/ui/sonner";
  import { BookHeart, Code, Github, HardDriveDownload, RefreshCcwDot } from "@lucide/svelte";
  import { emojis, load, Logger, LogLevel, render, type Rendered } from "@mateothegreat/dynamic-component-engine";
  import { onDestroy, onMount } from "svelte";
  import { toast } from "svelte-sonner";
  import type { SimpleProps } from "./components";

  let renderRef: HTMLDivElement;
  let sourceRef: HTMLPreElement;
  let sourceText = $state("");
  let isLoading = $state(true);
  let component: Rendered<SimpleProps>;
  let loadTime = $state(0);

  const logger = new Logger("app.svelte", { level: LogLevel.DEBUG });

  const recreate = (): void => {
    isLoading = true;
    logger.info("recreateComponent", `${emojis.Trash} destroying component (${component.name})`);
    component.destroy();
    setTimeout(() => {
      create();
      isLoading = false;
    }, 500);
  };

  const create = async (): Promise<void> => {
    const startTime = performance.now();
    isLoading = true;
    try {
      const source = await fetch("/entry.js").then((res) => res.text());
      sourceText = source;
      logger.info("createComponent", `⬇️ downloaded component source code (${source.length} bytes)`);

      const fn = await load(source);
      logger.info("createComponent", `${emojis.Checkmark} instantiated component function ("${fn.name}")`);

      /**
       * We pass type type to the render function to infer the type of the props for the
       * component. This is useful because we can then use the props type for accessing the
       * props of the renderedcomponent.
       */
      component = await render<SimpleProps>(fn, {
        source: source,
        target: renderRef,
        props: {
          /* Type safety! */
          name: "I'm but a simple component"
        }
      });

      /* More type safety!!! */
      console.log(component.props.name);

      logger.info("createComponent", `${emojis.Checkmark} mounted dynamic component (${component.name}) at ${renderRef.id}`);
      isLoading = false;
      loadTime = performance.now() - startTime;
      toast.success(`Component "${component.name}" downloaded and rendered in ${loadTime.toFixed(2)}ms! 🎉`, {
        duration: 5000
      });
    } catch (error) {
      logger.error("createComponent", `${emojis.Error} failed to mount component`, error);
    }
  };

  onMount(async () => create());

  onDestroy(() => {
    if (component) {
      logger.info("onDestroy", `${emojis.Trash} destroying dynamic component (${component.name})`);
      component.destroy();
    }
  });
</script>

{#snippet loading()}
  <div class="fade-in flex flex-col items-center gap-3 text-sm text-slate-500">
    <div class="border-6 h-10 w-10 animate-spin rounded-full border-slate-500 border-t-green-500"></div>
    <div class="text-lg font-medium text-green-400">Compiling component...</div>
  </div>
{/snippet}

<div class="border-b-3 flex flex-col gap-4 border-slate-800/50 bg-black/50 p-2 px-6 shadow-lg shadow-black/30">
  <div class="flex items-center gap-5">
    <header class="flex flex-1 flex-col gap-0.5">
      <h1 class="text-2xl font-semibold text-indigo-400">Svelte Dynamic Component Engine</h1>
      <p class="text-sm text-slate-500">This component was compiled and rendered at runtime in the browser using Svelte 5.</p>
    </header>
    <div class="m-4 flex flex-1 justify-end gap-2 text-xs text-indigo-400">
      <div class="mb-3.5 mr-7 rounded-md border-2 bg-black px-2 py-1.5 text-sm text-slate-500">
        running version: <a href="https://github.com/mateothegreat/svelte-dynamic-component-engine/tree/{window.___MATEOTHEGREAT_DYNAMIC_COMPONENT_ENGINE_VERSION__}" class="cursor-pointer font-semibold text-green-400 hover:text-blue-400" target="_blank">
          {window.___MATEOTHEGREAT_DYNAMIC_COMPONENT_ENGINE_VERSION__}
        </a>
      </div>
      <a href="https://github.com/mateothegreat/svelte-dynamic-component-engine" class="text-slate-400 hover:text-green-500" target="_blank">
        <Github class="h-8 w-8" />
      </a>
      <a href="https://github.com/mateothegreat/svelte-dynamic-component-engine" class="text-fuchsia-400 hover:text-green-500" target="_blank">
        <BookHeart class="h-8 w-8" />
      </a>
    </div>
  </div>
</div>

<main class="font-system container mx-auto flex flex-col gap-2 p-6">
  <section class="flex flex-col gap-2">
    <div class="text-primary text-lg font-medium">
      <div class="flex items-center justify-between gap-2">
        <div class="text-primary flex items-center gap-2 text-lg font-medium">
          <HardDriveDownload class="h-6 w-6 text-green-400" />
          Rendered Component
        </div>
        <Button onclick={recreate} disabled={isLoading} variant="outline">
          {isLoading ? "Creating..." : "Recreate Component"}
          <RefreshCcwDot class="h-4 w-4" />
        </Button>
      </div>
    </div>
    <div bind:this={renderRef} id="dynamic-component-container" class="fade-in flex min-h-[500px] flex-col items-center justify-center gap-4 rounded-lg border-4 border-dashed border-slate-800 bg-black p-8 transition-all duration-300 ease-in-out">
      {#if isLoading}
        {@render loading()}
      {/if}
    </div>
  </section>
  <div class="mr-1 flex justify-end gap-1">
    <p class="font-medium text-slate-500">🚀 Load + Render:</p>
    <p class="text-green-400">{loadTime.toFixed(2)}ms</p>
  </div>
  <section class="flex flex-col gap-2">
    <div class="text-primary flex items-center gap-2 text-lg font-medium">
      <Code class="h-6 w-6 text-gray-500" />
      Source Code
    </div>
    <div class="relative min-h-[200px] rounded-lg border-4 border-dashed border-slate-800 bg-black p-8 transition-all duration-300 ease-in-out">
      {#if isLoading}
        {@render loading()}
      {:else}
        <pre bind:this={sourceRef} class="overflow-x-auto whitespace-pre-wrap break-words text-left font-mono text-[11px]">{sourceText}</pre>
      {/if}
    </div>
  </section>
</main>

<Toaster />
