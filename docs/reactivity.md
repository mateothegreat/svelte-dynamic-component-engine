# Rune-Based Reactive State Sharing Problem Statement

The problem arises when Svelte 5 runes create reactive references that lose their reactivity when serialized across compilation boundaries.

## The Core Issue

When we have `let count = $state(123)` in our parent component, we're creating a reactive reference.

However, when we try to pass this to a dynamically compiled component, several things break the reactivity chain:

### 1. **Value** vs **Reference** Passing

Parent component:

```ts
let count = $state(123);
```

What you're actually passing to the dynamic component:

```ts
const props = { count }; // This passes the VALUE (123), not the reactive reference
```

The `$state(123)` creates a reactive proxy/reference, but when you put count in the props object, you're passing the current value (`123`), not the reactive reference itself.

### 2. Compilation Boundary Isolation

Parent component (compiled at build time):

```ts
let count = $state(123);
```

Dynamic component (compiled at runtime):

```ts
let { count } = $props(); // This creates a NEW local variable, disconnected from parent
```

Each Svelte compilation creates its own reactive scope. The dynamically compiled component has no knowledge of the parent's reactive system - **it's essentially a _separate_ "universe" of reactivity**.

### 3. Svelte's Internal Reactivity System

Svelte 5 runes work through:

+ Reactive proxies that track dependencies.
+ Effect scheduling that runs when dependencies change.
+ Component boundaries that isolate reactive scopes

When you pass count as a prop, the dynamic component receives a **snapshot** _value_, **not** a reactive subscription.

### 4. The Mount/Unmount API Limitation

```ts
const component = mount(DynamicComponent, { target, props: { count: 123 } });
```

Svelte's `mount()` API expects static props at mount time. It doesn't have a built-in mechanism to pass ongoing reactive references that update the component after mounting.

### Why The Original Approach Didn't Work

Parent component:

```ts
let count = $state(123);
```

Dynamic component template:

```ts
let { count = $bindable(0) } = $props();
```

This creates two separate reactive variables with the same name but no connection between them.

The `$bindable()` in the dynamic component creates its own reactive reference, completely isolated from the parent's `$state()`.

### The Real Solution Would Require

1) Passing reactive references (not values) across compilation boundaries.
2) Shared reactive context that both components can access.
3) Live prop updates after component mounting.
4) Cross-compilation reactive dependency tracking.

This is why the `SharedRuneStore` solution works (see [/src/shared-rune-store.ts](../src/shared-rune-store.ts)) - it creates a shared reactive context that both the parent and dynamic components can subscribe to, bypassing the compilation boundary limitations.

## Potential Solutions

### Solution 1: Reactive Context Injection

Modify the factory function to accept reactive context objects that get injected into the component's compilation scope.

Instead of passing static values, pass rune references directly through the compilation process.

**Approach**:

+ Extend `ComponentCompiler.render()` to accept a reactiveContext parameter containing rune objects.
+ Modify transformCompiledCode() to inject these runes as imports/globals in the compiled component.
+ The dynamic component accesses parent runes directly via injected context.

### Solution 2: Rune Reference Passing

Create a mechanism to pass actual rune references (not their values) through the mount system by

serializing rune getters/setters and reconstructing them in the dynamic component.

**Approach**:

+ Extend the factory function to accept rune descriptors `({ get: () => value, set: (v) => {...} })`.
+ Transform the compiled code to wire these descriptors to local rune state.
+ Dynamic components get direct access to parent runes through the descriptor interface.

### Solution 3: Shared Rune Store

Implement a global rune store that both parent and dynamic components can subscribe to, using Svelte 5's $state() with a singleton pattern.

**Approach**:

+ Create a `SharedRuneStore` class with `$state()` values.
+ Parent components register their runes in the store.
+ Dynamic components access the same rune references from the store.
+ No wrapper/proxy - direct rune access through shared state container.

### Solution 4: Compilation-Time Rune Binding

Modify the source transformation to replace rune references in the dynamic component with bindings to externally provided rune objects.

**Approach**:

+ Parse the dynamic component source for rune usage patterns.
+ Replace `let { count = $bindable(0) } = $props()` with direct external rune bindings.
+ Inject the actual parent runes as module-level imports during compilation.
+ Component uses parent runes as if they were its own.