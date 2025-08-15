// ComponentCompiler.ts
// Runtime Svelte 5 compiler/runner for browser environments.
//
// Design goals:
// - No brittle source rewriting of compiled output.
// - Work natively with Svelte 5's mount/unmount APIs.
// - Allow prop "updates" via predictable remounts (stable, future-proof).
// - Handle CSS for both injected and external modes.
// - Surface warnings and basic metadata to the caller.
// - Provide bounded caching to avoid memory bloat in long-running sessions.

import { mount, unmount } from "svelte";
import { compile, type CompileOptions, type CompileResult } from "svelte/compiler";

/**
 * The result returned by `render()`, including lifecycle controls and metadata.
 */
export interface CompiledComponent {
  /** The opaque handle returned by `mount` (not guaranteed stable API). */
  handle: unknown | null;
  /** Programmatic teardown of the component and any injected CSS. */
  destroy: () => void;
  /**
   * Update props. Implementation performs a safe re-mount to avoid reliance on internal instance APIs.
   * Designed for live previews—if you need micro-optimized updates, prefer a fixed component tree.
   */
  update: (props: Record<string, any>) => void;
  /** Compilation/runtime metadata useful for tooling and diagnostics. */
  result: {
    filename?: string;
    hasCSS: boolean;
    length: number;
    warnings: string[];
    /** Whether CSS was injected automatically by Svelte compiler. */
    cssMode: "injected" | "external";
    /** Cache hit (true) or compiled anew (false). */
    fromCache: boolean;
  };
}

/**
 * Options that influence compilation and runtime behavior.
 */
export interface CompilerOptions {
  /**
   * CSS mode:
   * - 'injected': Svelte injects CSS via JS at runtime (best for playgrounds).
   * - 'external': Compiler emits CSS separately; we attach/detach a <style> element per instance.
   */
  cssMode?: "injected" | "external";
  /** Generate sourcemaps for friendlier stack traces/devtools. */
  sourcemap?: boolean;
  /** Logical filename to embed in compiler output and diagnostics. */
  name?: string;
  /**
   * Enable caching compiled modules by (source, compile options). Recommended for live editors.
   */
  cache?: boolean;
  /**
   * Max compiled entries retained. Only used when `cache` is true. Defaults to 50.
   * Evicts least-recently-used entries on overflow.
   */
  cacheSize?: number;
  /**
   * Control whether we clear the target's innerHTML on destroy (defaults true).
   * Disable if mounting into a shared container where you manage cleanup.
   */
  clearTargetOnDestroy?: boolean;
}

/**
 * Minimal LRU cache (Map-based) to bound memory usage in long-lived apps.
 * Stores arbitrary values keyed by string cache keys.
 */
class LRUCache<V> {
  private map = new Map<string, V>();
  constructor(private readonly max: number) {}

  get(key: string): V | undefined {
    const val = this.map.get(key);
    if (val !== undefined) {
      // Reinsert to mark as most-recently-used.
      this.map.delete(key);
      this.map.set(key, val);
    }
    return val;
  }

  set(key: string, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    }
    this.map.set(key, value);
    this.evictIfNeeded();
  }

  clear(): void {
    this.map.clear();
  }

  private evictIfNeeded(): void {
    while (this.map.size > this.max) {
      // Evict least-recently-used (Map iteration order: insertion order).
      const oldestKey = this.map.keys().next().value;
      this.map.delete(oldestKey);
    }
  }
}

/**
 * Internal shape stored in the cache for reuse across renders.
 */
interface CachedModule {
  /** The compiled module's default export (the component definition). */
  componentDef: unknown;
  /** The length of compiled JS to expose in metadata. */
  length: number;
  /** Whether the compilation emitted separate CSS. */
  hasCSS: boolean;
  /** Compiler warnings captured at compile time. */
  warnings: string[];
  /** CSS code if cssMode === 'external' and compiler emitted it. */
  cssCode?: string;
  /** Logical filename for diagnostics. */
  filename?: string;
  /** The cssMode used at compile time. */
  cssMode: "injected" | "external";
}

/**
 * Runtime compiler for Svelte 5 components from source strings.
 * - Compiles to an ES module in-memory (Blob URL) and dynamically imports it.
 * - Mounts using Svelte's official mount/unmount APIs (no private instance APIs).
 * - Handles external CSS by attaching/removing a <style> tag per render.
 * - Provides bounded caching to avoid memory leaks.
 */
export class ComponentCompiler1 {
  // Shared LRU cache for compiled modules.
  private static lru: LRUCache<CachedModule> | null = null;

  // -------------- Public API --------------

  /**
   * Compile and mount a Svelte component from source into a DOM target.
   *
   * Usage:
   * const comp = await ComponentCompiler.render(src, el, { name: "Demo.svelte" });
   * comp.update({ foo: 1 });
   * comp.destroy();
   */
  static async render(
    source: string,
    target: HTMLElement,
    props: Record<string, any> = {},
    options: CompilerOptions = {}
  ): Promise<CompiledComponent> {
    const normalized = this.normalizeOptions(options);
    const cacheKey = normalized.cache ? this.makeCacheKey(source, normalized) : null;

    // Try cache first (if enabled)
    let cached = cacheKey ? this.cache().get(cacheKey) : undefined;
    let fromCache = Boolean(cached);

    if (!cached) {
      // Compile source → JS (and CSS if external)
      const compiled = this.compileSource(source, normalized);

      // Load compiled JS as a module and grab its default export (the component definition)
      const componentDef = await this.loadModule(compiled.js.code);

      cached = {
        componentDef,
        length: compiled.js.code.length,
        hasCSS: Boolean(compiled.css && compiled.css.code && compiled.css.code.length > 0),
        warnings: (compiled.warnings || []).map((w) => this.formatWarning(w)),
        cssCode: compiled.css?.code,
        filename: normalized.name,
        cssMode: normalized.cssMode
      };

      if (cacheKey) this.cache().set(cacheKey, cached);
      fromCache = false;
    }

    // Handle CSS for 'external' mode: attach a <style> to document.head and clean it up on destroy.
    const styleEl =
      cached.cssMode === "external" && cached.cssCode
        ? this.attachStyle(cached.cssCode, cached.filename)
        : null;

    // Mount the component into the target with the provided props.
    let currentProps = props;
    let handle: unknown | null = mount(cached.componentDef as any, { target, props: currentProps });

    // Provide a predictable, safe update strategy: re-mount when props change.
    // This avoids relying on unofficial instance APIs and remains stable across Svelte versions.
    const update = (newProps: Record<string, any>) => {
      currentProps = newProps || {};
      if (handle) {
        unmount(handle as any);
        handle = null;
      }
      handle = mount(cached!.componentDef as any, { target, props: currentProps });
    };

    const destroy = () => {
      if (handle) {
        unmount(handle as any);
        handle = null;
      }
      if (styleEl) {
        styleEl.remove();
      }
      if (normalized.clearTargetOnDestroy) {
        target.innerHTML = "";
      }
    };

    return {
      handle,
      destroy,
      update,
      result: {
        filename: cached.filename,
        hasCSS: cached.hasCSS,
        length: cached.length,
        warnings: cached.warnings,
        cssMode: cached.cssMode,
        fromCache
      }
    };
  }

  /**
   * Clear the internal compilation cache (all entries).
   * Useful for development or when you need to force recompilation.
   */
  static clearCache(): void {
    if (this.lru) this.lru.clear();
  }

  // -------------- Internals --------------

  /**
   * Compile Svelte source to JavaScript (and CSS if 'external').
   * Throws a friendly error if <script lang="ts"> is present and no TS preprocessing is supported.
   */
  private static compileSource(source: string, options: Required<CompilerOptions>): CompileResult {
    // Minimal safeguard: the svelte/compiler does not transpile TS on its own in-browser.
    // If you expect TS sources, integrate `svelte-preprocess` + `typescript` before calling this.
    if (/<script[^>]*lang=["']ts["']/.test(source)) {
      throw new Error(
        'TypeScript sources require preprocessing before compilation (found <script lang="ts">).'
      );
    }

    const compileOptions: CompileOptions = {
      generate: "client",
      css: options.cssMode === "injected" ? "injected" : "external",
      runes: true,
      modernAst: true,
      filename: options.name || "DynamicComponent.svelte",
      // Use boolean here — `"inline"` breaks in-browser compile
      sourcemap: options.sourcemap ? "inline" : undefined
    };

    console.log(source);
    console.log(compileOptions);
    console.log(compile(source, compileOptions));
    return compile(source, compileOptions);
  }

  /**
   * Dynamically import a string of JS as an ES module and return its default export.
   * Ensures the Blob URL is revoked after the module is loaded.
   */
  private static async loadModule(jsCode: string): Promise<unknown> {
    const url = URL.createObjectURL(new Blob([jsCode], { type: "application/javascript" }));
    try {
      // @vite-ignore: prevent tooling from trying to bundle this dynamic path
      const mod = await import(/* @vite-ignore */ url);
      return mod.default;
    } finally {
      // Revoke only after the module has been evaluated and loaded.
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Inject a <style> into document.head for external CSS mode.
   * Returns the node so the caller can remove it on destroy.
   */
  private static attachStyle(cssCode: string, filename?: string | undefined): HTMLStyleElement {
    const style = document.createElement("style");
    style.setAttribute("data-svelte-external-css", filename || "DynamicComponent.svelte");
    style.textContent = cssCode;
    document.head.appendChild(style);
    return style;
  }

  /**
   * Create or get the shared LRU cache instance.
   */
  private static cache(): LRUCache<CachedModule> {
    if (!this.lru) {
      // Default to 50 unless overridden by the first caller's options.
      this.lru = new LRUCache<CachedModule>(50);
    }
    return this.lru;
  }

  /**
   * Normalize options with defaults and initialize LRU capacity on first use.
   */
  private static normalizeOptions(opts: CompilerOptions): Required<CompilerOptions> {
    const normalized: Required<CompilerOptions> = {
      cssMode: opts.cssMode ?? "injected",
      sourcemap: opts.sourcemap ?? true,
      name: opts.name ?? "DynamicComponent.svelte",
      cache: opts.cache ?? true,
      cacheSize: opts.cacheSize ?? 50,
      clearTargetOnDestroy: opts.clearTargetOnDestroy ?? true
    };

    // Initialize LRU size if not already created or if size differs.
    if (!this.lru || (this.lru as any).max !== normalized.cacheSize) {
      this.lru = new LRUCache<CachedModule>(normalized.cacheSize);
    }

    return normalized;
  }

  /**
   * Build a stable cache key from source + compile-affecting options.
   * Props and target are intentionally excluded.
   */
  private static makeCacheKey(source: string, options: Required<CompilerOptions>): string {
    // Only include fields that affect compiled output.
    const keyObj = {
      source,
      name: options.name,
      cssMode: options.cssMode,
      sourcemap: options.sourcemap
    };
    // Stable stringify (keys in a predictable order).
    return JSON.stringify(keyObj);
  }

  /**
   * Render concise, readable compiler warnings.
   */
  private static formatWarning(w: any): string {
    const code = w.code ? `[${w.code}] ` : "";
    const msg = w.message || String(w);
    const pos =
      w.start && typeof w.start.line === "number" && typeof w.start.column === "number"
        ? ` (line ${w.start.line}, col ${w.start.column})`
        : "";
    return `${code}${msg}${pos}`;
  }
}
