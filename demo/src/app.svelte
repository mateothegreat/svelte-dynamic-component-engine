<script lang="ts">
  import { emojis, load, Logger, LogLevel, render, type Rendered } from "@mateothegreat/dynamic-component-engine";
  import { onDestroy, onMount } from "svelte";
  import type { SimpleProps } from "./components";

  let renderRef: HTMLDivElement;
  let sourceRef: HTMLPreElement;
  let isLoading = $state(false);
  let component: Rendered<SimpleProps>;

  const logger = new Logger("app.svelte", { level: LogLevel.DEBUG });

  const recreate = (): void => {
    logger.info("recreateComponent", `${emojis.Trash} destroying component (${component.name})`);
    component.destroy();
    create();
  };

  const create = async (): Promise<void> => {
    try {
      const source = await fetch("/entry.js").then((res) => res.text());
      sourceRef.textContent = source;
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

<svelte:head>
  <title>Dynamic Svelte Component Renderer</title>
</svelte:head>

<main class="container">
  <header class="header">
    <h1>🚀 Dynamic Component Host</h1>
    <p>This component was compiled and rendered at runtime in the browser using Svelte 5.</p>
    <div class="controls">
      <button onclick={recreate} disabled={isLoading}>
        {isLoading ? "Creating..." : "Recreate Component"}
      </button>
    </div>
  </header>

  <section class="component-section">
    <h2>Dynamic Component Rendered:</h2>
    <div bind:this={renderRef} id="dynamic-component-container" class="component-container" class:loading={isLoading}>
      {#if isLoading}
        <div class="loading-indicator">
          <div class="spinner"></div>
          <span>Compiling component...</span>
        </div>
      {/if}
    </div>
  </section>

  <section class="component-section">
    <h2>Dynamic Component Source Code:</h2>
    <div class="component-container" class:loading={isLoading}>
      <pre bind:this={sourceRef} class="source-code"></pre>
      {#if isLoading}
        <div class="loading-indicator">
          <div class="spinner"></div>
          <span>Loading component source code...</span>
        </div>
      {/if}
    </div>
  </section>
</main>

<style>
  .container {
    margin: 0 auto;
    padding: 24px;
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
  }

  .header {
    margin-bottom: 32px;
  }

  .header h1 {
    color: #bbc2cc;
    margin-bottom: 8px;
  }

  .header p {
    color: #6b7280;
    margin-bottom: 16px;
  }

  .controls {
    margin: 16px 0;
  }

  .controls button {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }

  .controls button:hover:not(:disabled) {
    background: #2563eb;
    transform: translateY(-1px);
  }

  .controls button:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
  }

  .component-section h2 {
    color: #f9fafb;
    margin-bottom: 16px;
  }

  .component-container {
    min-height: 200px;
    border: 6px dashed #8158b3;
    border-radius: 8px;
    padding: 16px;
    background: #101112;
    position: relative;
    transition: all 0.3s ease;
  }

  .component-container.loading {
    background: #f3f4f6;
    border-color: #9ca3af;
  }

  .loading-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #6b7280;
    font-size: 14px;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  /* Global styles for dynamic components */
  :global(.dynamic-wrapper) {
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .source-code {
    text-align: left;
    font-size: 11px;
    font-family: monospace;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-x: auto;
  }
</style>
