Solutions for Rune-Based Reactive State Sharing

Solution 1: Reactive Context Injection

Modify the factory function to accept reactive context objects that get injected into the
component's compilation scope. Instead of passing static values, pass rune references directly
through the compilation process.

Approach:
- Extend ComponentCompiler.render() to accept a reactiveContext parameter containing rune
objects
- Modify transformCompiledCode() to inject these runes as imports/globals in the compiled
component
- The dynamic component accesses parent runes directly via injected context

Solution 2: Rune Reference Passing

Create a mechanism to pass actual rune references (not their values) through the mount system by
  serializing rune getters/setters and reconstructing them in the dynamic component.

Approach:
- Extend the factory function to accept rune descriptors ({ get: () => value, set: (v) => {...} 
})
- Transform the compiled code to wire these descriptors to local rune state
- Dynamic components get direct access to parent runes through the descriptor interface

Solution 3: Shared Rune Store

Implement a global rune store that both parent and dynamic components can subscribe to, using
Svelte 5's $state() with a singleton pattern.

Approach:
- Create a SharedRuneStore class with $state() values
- Parent components register their runes in the store
- Dynamic components access the same rune references from the store
- No wrapper/proxy - direct rune access through shared state container

Solution 4: Compilation-Time Rune Binding

Modify the source transformation to replace rune references in the dynamic component with
bindings to externally provided rune objects.

Approach:
- Parse the dynamic component source for rune usage patterns
- Replace let { count = $bindable(0) } = $props() with direct external rune bindings
- Inject the actual parent runes as module-level imports during compilation
- Component uses parent runes as if they were its own