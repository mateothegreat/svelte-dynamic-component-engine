<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  // import { createDynamicComponent, type DynamicComponentResult } from "./lib/gemini";
  import { createDynamicComponent, createErrorDisplay, validateComponentSource, type DynamicComponentResult } from "./lib/dynamic-components";
  // import { createDynamicComponent, createErrorDisplay, validateComponentSource, type DynamicComponentResult } from "./lib/claude";
  // import { createDynamicComponent, type DynamicComponentResult } from "./lib/stripper";
  // import { dumb } from "./lib/dumb";
  // import { createSecureDynamicComponent, type SecureDynamicComponentResult } from "./lib/secure-dynamic-component";
  // The container where the dynamic component will be mounted
  let dynamicComponentContainer: HTMLDivElement;
  let currentComponent: DynamicComponentResult | SecureDynamicComponentResult | null = null;
  let isLoading = false;
  let validationErrors: string[] = [];

  const componentString = `
<script>
  let count = $state(0);
  let message = $state("Hello from dynamic component!");
  
  function increment() {
    count++;
  }
  
  function reset() {
    count = 0;
  }
<\/script>

<style>
  .dynamic-wrapper {
    padding: 20px;
    border: 2px solid steelblue;
    border-radius: 8px;
    background: #f8fafc;
  }
  
  h1 { 
    color: steelblue; 
    font-family: sans-serif; 
    margin: 0 0 16px 0;
  }
  
  .controls {
    display: flex;
    gap: 8px;
    margin-top: 16px;
  }
  
  button {
    background: steelblue;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
  }
  
  button:hover {
    background: #3b82c6;
  }
  
  button:active {
    transform: translateY(1px);
  }
  
  .count-display {
    font-size: 18px;
    font-weight: bold;
    color: #374151;
    margin: 12px 0;
  }
  
  .message {
    color: #6b7280;
    font-style: italic;
    margin-bottom: 16px;
  }
<\/style>

<div class="dynamic-wrapper">
  <h1>✨ Dynamic Svelte Component</h1>
  <p class="message">{message}</p>
  <div class="count-display">Count: {count}</div>
  
  <div class="controls">
    <button onclick={increment}>
      Increment
    </button>
    <button onclick={reset}>
      Reset
    </button>
    <button onclick={() => message = \`Updated at \${new Date().toLocaleTimeString()}\`}>
      Update Message
    </button>
  </div>
</div>
`;

  /**
   * Creates and mounts the dynamic component with proper error handling.
   */
  // async function createAndMountComponent(): Promise<void> {
  //   if (!dynamicComponentContainer) {
  //     console.error("Container not available");
  //     return;
  //   }

  //   // Clean up existing component
  //   if (currentComponent) {
  //     currentComponent.destroy();
  //     currentComponent = null;
  //   }

  //   // Clear container
  //   dynamicComponentContainer.innerHTML = "";
  //   isLoading = true;
  //   validationErrors = [];

  //   try {
  //     // Validate component source first
  //     // const validation = validateComponentSource(componentString);
  //     // console.log(validation);
  //     // if (!validation.isValid) {
  //     //   validationErrors = validation.errors;
  //     //   createErrorDisplay(
  //     //     new Error(`Validation failed:\n${validation.errors.join('\n')}`),
  //     //     dynamicComponentContainer
  //     //   );
  //     //   return;
  //     // }

  //     // Try the primary approach first, fallback to alternative if it fails
  //     currentComponent = await createDynamicComponent({
  //       componentSource: componentString,
  //       target: dynamicComponentContainer,
  //       filename: "DynamicComponent.svelte",
  //       runes: true
  //     });
  //     console.log("✅ Dynamic component created successfully using primary approach");
  //   } catch (error) {
  //     console.error("❌ Error creating dynamic component:", error);
  //     createErrorDisplay(error instanceof Error ? error : new Error(String(error)), dynamicComponentContainer);
  //   } finally {
  //     isLoading = false;
  //   }
  // }

  /**
   * Recreates the component (useful for testing updates).
   */
  function recreateComponent(): void {
    // createAndMountComponent();
  }

  async function createComponent() {
    try {
      if (currentComponent) {
        currentComponent.destroy();
      }

      currentComponent = await createSecureDynamicComponent({
        componentSource: componentString,
        target: dynamicComponentContainer,
        security: {
          maxExecutionTime: 3000,
          allowedTags: ["div", "h1", "button", "p", "span"],
          allowedCssProperties: ["color", "background", "padding", "margin", "border"]
        }
      });

      console.log("✅ Secure component created successfully");
    } catch (error) {
      console.error("❌ Security violation or compilation error:", error);
    }
  }

  onMount(async () => {
    // const instance = await dumb({
    //   componentSource: componentString,
    //   target: dynamicComponentContainer
    // });
    // console.log(instance);
    createComponent();
  });

  onDestroy(() => {
    if (currentComponent) {
      currentComponent.destroy();
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
      <button onclick={recreateComponent} disabled={isLoading}>
        {isLoading ? "Creating..." : "Recreate Component"}
      </button>
    </div>

    {#if validationErrors.length > 0}
      <div class="validation-errors">
        <h3>Validation Errors:</h3>
        <ul>
          {#each validationErrors as error}
            <li>{error}</li>
          {/each}
        </ul>
      </div>
    {/if}
  </header>

  <section class="component-section">
    <h2>Dynamic Component:</h2>
    <div bind:this={dynamicComponentContainer} class="component-container" class:loading={isLoading}>
      {#if isLoading}
        <div class="loading-indicator">
          <div class="spinner"></div>
          <span>Compiling component...</span>
        </div>
      {/if}
    </div>
  </section>
</main>

<style>
  .container {
    max-width: 800px;
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
    color: #1f2937;
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

  .validation-errors {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    padding: 16px;
    margin: 16px 0;
  }

  .validation-errors h3 {
    color: #dc2626;
    margin: 0 0 8px 0;
  }

  .validation-errors ul {
    color: #b91c1c;
    margin: 0;
    padding-left: 20px;
  }

  .component-section h2 {
    color: #374151;
    margin-bottom: 16px;
  }

  .component-container {
    min-height: 200px;
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    padding: 16px;
    background: #f9fafb;
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
</style>
