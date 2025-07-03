<script lang="ts">
  import { Button } from "$components/button";
  import { emojis, load, Logger, LogLevel, render, type Rendered } from "@mateothegreat/dynamic-component-engine";
  import { onDestroy, onMount } from "svelte";
  import type { SimpleProps } from "./components";

  let renderRef: HTMLDivElement;
  let sourceRef: HTMLPreElement;
  let isLoading = $state(true);
  let component: Rendered<SimpleProps>;

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
    isLoading = true;
    try {
      const source = await fetch("/entry.js").then((res) => res.text());
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

<main class="font-system container mx-auto flex flex-col gap-4 p-6">
  <header class="mb-8">
    <h1 class="mb-2 text-[#bbc2cc]">🚀 Dynamic Component Host</h1>
    <p class="mb-4 text-[#6b7280]">This component was compiled and rendered at runtime in the browser using Svelte 5.</p>
    <div class="my-4">
      <Button onclick={recreate} disabled={isLoading}>
        {isLoading ? "Creating..." : "Recreate Component"}
      </Button>
    </div>
  </header>

  <section class="flex flex-col gap-1">
    <div class="text-primary text-lg font-medium">Dynamic Component Rendered</div>
    <div
      bind:this={renderRef}
      id="dynamic-component-container"
      class="fade-in relative flex h-full min-h-[200px] w-full items-center justify-center rounded-lg border-[6px] border-dashed border-[#8158b3] bg-[#101112] p-4 transition-all duration-300 ease-in-out
             {isLoading ? 'border-[#9ca3af] bg-black/50' : ''}">
      {#if isLoading}
        <div class="fade-in gap-3 text-sm text-[#6b7280]">
          <div class="h-5 w-5 animate-spin rounded-full border-2 border-[#e5e7eb] border-t-[#3b82f6]"></div>
          <span>Compiling component...</span>
        </div>
      {/if}
    </div>
  </section>

  <section class="flex flex-col gap-1">
    <div class="text-primary text-lg font-medium">Dynamic Component Source Code</div>
    <div
      class="relative min-h-[200px] rounded-lg border-[6px] border-dashed border-[#8158b3] bg-[#101112] p-4 transition-all duration-300 ease-in-out
                {isLoading ? 'border-[#9ca3af] bg-black/50' : ''}">
      {#if isLoading}
        <div class="flex items-center justify-center gap-3 text-sm text-[#6b7280]">
          <div class="h-5 w-5 animate-spin rounded-full border-2 border-[#e5e7eb] border-t-[#3b82f6]"></div>
          <span>Loading component source code...</span>
        </div>
      {:else}
        <pre bind:this={sourceRef} class="overflow-x-auto whitespace-pre-wrap break-words text-left font-mono text-[11px]"></pre>
      {/if}
    </div>
  </section>
</main>
