<script lang="ts">
  import { Badge } from "$lib/components/ui/badge";
  import { Button } from "$lib/components/ui/button";
  import { Toaster } from "$lib/components/ui/sonner";
  import Window from "$lib/components/window.svelte";
  import { BookHeart, BugPlay, Code, Github, HardDriveDownload, RefreshCcwDot, TerminalIcon } from "@lucide/svelte";
  import { emojis, load, Logger, LogLevel, render, type Rendered } from "@mateothegreat/dynamic-component-engine";
  import { onDestroy, onMount } from "svelte";
  import { toast } from "svelte-sonner";
  import type { SimpleProps } from "./components";
  import { UseClipboard } from "./extras/hooks/use-clipboard.svelte";
  import { getVersion } from "./version/browser";

  let renderRef: HTMLDivElement | undefined = $state(undefined);
  let sourceRef: HTMLPreElement | undefined = $state(undefined);
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
        target: renderRef!,
        props: {
          /* Type safety! */
          name: "I'm but a simple component"
        }
      });

      /* More type safety!!! */
      console.log(component.props.name);

      isLoading = false;
      loadTime = performance.now() - startTime;

      logger.info("createComponent", `${emojis.Checkmark} mounted dynamic component (${component.name}) at ${renderRef!.id}`);
      toast.success(`Component "${component.name}" downloaded and rendered in ${loadTime.toFixed(2)}ms! 🎉`);
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

  const clipboard = new UseClipboard();
</script>

{#snippet loading()}
  <div class="fade-in flex flex-col items-center gap-3 text-sm text-slate-500">
    <div class="border-6 h-10 w-10 animate-spin rounded-full border-slate-500 border-t-green-500"></div>
    <div class="text-lg font-medium text-green-400">Compiling component...</div>
  </div>
{/snippet}

{#snippet pkg()}
  {@const version = getVersion()}
  <Button
    onclick={() => {
      clipboard.copy(`npm install @mateothegreat/svelte-dynamic-component-engine@${version.tag}`);
      toast.success(`npm install @mateothegreat/svelte-dynamic-component-engine@${version.tag} 👏 copied to clipboard`);
    }}
    variant="default"
    size="sm"
    class="w-fit bg-zinc-900/80 border-slate-700 border hover:bg-black hover:border-slate-700">
    <TerminalIcon class="text-slate-500" />
    <span class="font-mono text-xs text-green-400">npm install @mateothegreat/svelte-dynamic-component-engine@{version.tag}</span>
  </Button>
{/snippet}

<div class="flex items-center gap-2 border-b-3 border-slate-800/50 bg-black/50 p-4 shadow-lg shadow-black/30">
  <header class="flex flex-1 flex-col gap-0.5">
    <div class="flex items-center gap-2">
      <div class="font-title text-gradient-animated">Svelte Dynamic Component Engine</div>
      <Badge class="text-xs font-semibold bg-black text-fuchsia-400 border-slate-500/50 -mt-6 ml-1">
        <BugPlay />
        Live Demo
      </Badge>
    </div>
    <p class="text-sm text-slate-500 font-subtitle w-1/2">This demo shows how to use the Svelte Dynamic Component Engine to render a component at runtime in the browser using Svelte 5.</p>
  </header>
  <a href="https://github.com/mateothegreat/svelte-dynamic-component-engine" class="text-slate-400 hover:text-green-500" target="_blank">
    <Github class="h-5 w-5" />
  </a>
  <a href="https://github.com/mateothegreat/svelte-dynamic-component-engine" class="text-fuchsia-400 hover:text-green-500" target="_blank">
    <BookHeart class="h-5 w-5" />
  </a>
  {@render pkg()}
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
    <Window>
      <svelte:boundary
        onerror={(e, reset) => {
          console.error("<svelte:boundary> trapped an error:", e);
          reset();
        }}>
        <div bind:this={renderRef} id="dynamic-component-container" class="fade-in flex min-h-[500px] flex-col items-center justify-center gap-4 p-8 transition-all duration-300 ease-in-out">
          {#if isLoading}
            {@render loading()}
          {/if}
        </div>
      </svelte:boundary>
    </Window>
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
