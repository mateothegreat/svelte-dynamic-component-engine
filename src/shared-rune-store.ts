/**
 * Shared Rune Store for reactive state sharing between parent and dynamically compiled components.
 * Creates a bridge for passing reactive state between components without using runes directly in TS.
 */

type StateValue<T = any> = {
  value: T;
  subscribers: Set<() => void>;
};

export class SharedRuneStore {
  private static instance: SharedRuneStore | null = null;
  private store = new Map<string, StateValue>();

  private constructor() {}

  static getInstance(): SharedRuneStore {
    if (!SharedRuneStore.instance) {
      SharedRuneStore.instance = new SharedRuneStore();
    }
    return SharedRuneStore.instance;
  }

  /**
   * Set a reactive value in the store
   */
  set<T>(key: string, value: T): void {
    if (!this.store.has(key)) {
      this.store.set(key, { value, subscribers: new Set() });
    } else {
      const state = this.store.get(key)!;
      state.value = value;
      // Notify all subscribers
      state.subscribers.forEach(callback => callback());
    }
  }

  /**
   * Get a reactive value from the store
   */
  get<T>(key: string): T {
    const state = this.store.get(key);
    return state ? state.value : undefined;
  }

  /**
   * Subscribe to changes on a key
   */
  subscribe<T>(key: string, callback: (value: T) => void): () => void {
    if (!this.store.has(key)) {
      this.store.set(key, { value: undefined, subscribers: new Set() });
    }
    
    const state = this.store.get(key)!;
    const wrappedCallback = () => callback(state.value);
    state.subscribers.add(wrappedCallback);
    
    // Return unsubscribe function
    return () => {
      state.subscribers.delete(wrappedCallback);
    };
  }

  /**
   * Get a reactive getter function for a store value
   */
  getter<T>(key: string): () => T {
    return () => this.get<T>(key);
  }

  /**
   * Get a reactive setter function for a store value
   */
  setter<T>(key: string): (value: T) => void {
    return (value: T) => {
      this.set(key, value);
    };
  }

  /**
   * Get both getter and setter for a store value
   */
  accessor<T>(key: string): { get: () => T; set: (value: T) => void } {
    return {
      get: this.getter<T>(key),
      set: this.setter<T>(key)
    };
  }

  /**
   * Check if a key exists in the store
   */
  has(key: string): boolean {
    return this.store.has(key);
  }

  /**
   * Remove a value from the store
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear all values from the store
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get all keys in the store
   */
  keys(): string[] {
    return Array.from(this.store.keys());
  }

  /**
   * Create a reactive reference for use in Svelte components
   */
  createReactiveRef<T>(key: string, initialValue?: T): {
    get value(): T;
    set value(newValue: T);
  } {
    // Initialize with the provided initial value if key doesn't exist
    if (!this.has(key) && initialValue !== undefined) {
      this.set(key, initialValue);
    }

    return {
      get value(): T {
        return this.get<T>(key);
      },
      set value(newValue: T) {
        this.set(key, newValue);
      }
    };
  }
}

// Export singleton instance for convenience
export const sharedStore = SharedRuneStore.getInstance();