// import { JSDOM } from "jsdom";
// import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// import { SvelteRuntimeCompiler } from "./runtime-orig";

// describe("SvelteRuntimeCompiler", () => {
//   let dom: JSDOM;
//   let container: HTMLElement;

//   beforeEach(() => {
//     // Setup DOM environment
//     dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
//     global.document = dom.window.document as any;
//     global.window = dom.window as any;
//     global.HTMLElement = dom.window.HTMLElement;
//     global.URL = dom.window.URL;
//     global.Blob = dom.window.Blob;

//     // Create container for component mounting
//     container = document.createElement("div");
//     container.id = "test-container";
//     document.body.appendChild(container);
//   });

//   afterEach(() => {
//     // Cleanup
//     if (container && container.parentNode) {
//       container.parentNode.removeChild(container);
//     }
//     SvelteRuntimeCompiler.clearCache();
//   });

//   describe("render", () => {
//     it("should compile and render a simple component", async () => {
//       const source = `
//         <script>
//           let { name = 'World' } = $props();
//         </script>
//         <h1>Hello {name}!</h1>
//       `;

//       const component = await SvelteRuntimeCompiler.render(source, container, { name: "Test" });

//       expect(component).toBeDefined();
//       expect(component.component).toBeDefined();
//       expect(component.destroy).toBeInstanceOf(Function);
//       expect(component.update).toBeInstanceOf(Function);
//     });

//     it("should compile component with state and reactivity", async () => {
//       const source = `
//         <script>
//           let count = $state(0);
//           let { initialValue = 0 } = $props();

//           $effect(() => {
//             count = initialValue;
//           });
//         </script>
//         <div>
//           <p>Count: {count}</p>
//           <button onclick={() => count++}>Increment</button>
//         </div>
//       `;

//       const component = await SvelteRuntimeCompiler.render(source, container, { initialValue: 5 });

//       expect(component).toBeDefined();
//       expect(component.component).toBeDefined();
//     });

//     it("should handle CSS injection when enabled", async () => {
//       const source = `
//         <script>
//           let { color = 'blue' } = $props();
//         </script>

//         <div class="styled">Hello!</div>

//         <style>
//           .styled {
//             color: var(--color);
//           }
//         </style>
//       `;

//       const component = await SvelteRuntimeCompiler.render(
//         source,
//         container,
//         { color: "red" },
//         { injectCss: true }
//       );

//       expect(component).toBeDefined();
//     });

//     it("should handle component destruction", async () => {
//       const source = `
//         <script>
//           let { text = 'Hello' } = $props();
//         </script>
//         <p>{text}</p>
//       `;

//       const component = await SvelteRuntimeCompiler.render(source, container, { text: "Test" });

//       expect(container.innerHTML).not.toBe("");

//       component.destroy();

//       expect(container.innerHTML).toBe("");
//     });

//     it("should cache compiled components", async () => {
//       const source = `
//         <script>
//           let { value = 0 } = $props();
//         </script>
//         <span>{value}</span>
//       `;

//       // First render
//       const component1 = await SvelteRuntimeCompiler.render(source, container, { value: 1 });

//       // Destroy first component
//       component1.destroy();

//       // Create new container
//       const container2 = document.createElement("div");
//       document.body.appendChild(container2);

//       // Second render (should use cache)
//       const component2 = await SvelteRuntimeCompiler.render(source, container2, { value: 2 });

//       expect(component2).toBeDefined();

//       // Cleanup
//       component2.destroy();
//       container2.parentNode?.removeChild(container2);
//     });

//     it("should handle compilation errors gracefully", async () => {
//       const invalidSource = `
//         <script>
//           // Invalid syntax
//           let { = $props();
//         </script>
//         <p>Test</p>
//       `;

//       await expect(SvelteRuntimeCompiler.render(invalidSource, container)).rejects.toThrow(
//         "Component compilation failed"
//       );
//     });

//     it("should use custom component name when provided", async () => {
//       const source = `
//         <script>
//           let { greeting = 'Hi' } = $props();
//         </script>
//         <p>{greeting}</p>
//       `;

//       const component = await SvelteRuntimeCompiler.render(
//         source,
//         container,
//         { greeting: "Hello" },
//         { name: "CustomGreeting" }
//       );

//       expect(component).toBeDefined();
//       // The component name is used internally in the factory
//     });

//     it("should handle components with effects", async () => {
//       const source = `
//         <script>
//           let count = $state(0);
//           let doubled = $state(0);

//           $effect(() => {
//             doubled = count * 2;
//           });
//         </script>
//         <div>
//           <p>Count: {count}</p>
//           <p>Doubled: {doubled}</p>
//         </div>
//       `;

//       const component = await SvelteRuntimeCompiler.render(source, container);

//       expect(component).toBeDefined();
//     });

//     it("should log warning when update is called", async () => {
//       const consoleSpy = vi.spyOn(console, "warn");

//       const source = `
//         <script>
//           let { text = 'Initial' } = $props();
//         </script>
//         <p>{text}</p>
//       `;

//       const component = await SvelteRuntimeCompiler.render(source, container, { text: "Test" });

//       component.update?.({ text: "Updated" });

//       expect(consoleSpy).toHaveBeenCalledWith(
//         "Direct prop updates not supported in runtime compilation. Recreate component instead."
//       );

//       consoleSpy.mockRestore();
//     });
//   });

//   describe("clearCache", () => {
//     it("should clear the component cache", async () => {
//       const consoleSpy = vi.spyOn(console, "log");

//       const source = `
//         <script>
//           let { value = 0 } = $props();
//         </script>
//         <span>{value}</span>
//       `;

//       // Compile once to populate cache
//       const component = await SvelteRuntimeCompiler.render(source, container, { value: 1 });
//       component.destroy();

//       // Clear cache
//       SvelteRuntimeCompiler.clearCache();

//       expect(consoleSpy).toHaveBeenCalledWith("Component cache cleared");

//       consoleSpy.mockRestore();
//     });
//   });
// });
