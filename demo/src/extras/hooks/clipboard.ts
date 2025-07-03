// src/lib/actions/clipboard.ts

import type { Attachment } from "svelte/attachments";

export type ClipboardStatus = "idle" | "success" | "failure";

export interface ClipboardOptions {
  /** The text to copy to clipboard */
  text: string;
  /** The time in milliseconds before the status resets to idle (default: 2000) */
  delay?: number;
  /** Callback when copy succeeds */
  onSuccess?: (text: string) => void;
  /** Callback when copy fails */
  onFailure?: (error: Error) => void;
  /** Callback when status changes */
  onStatusChange?: (status: ClipboardStatus) => void;
}

interface ClipboardState {
  status: ClipboardStatus;
  timeout?: ReturnType<typeof setTimeout>;
}

/**
 * Svelte 5 attachment action for copying text to clipboard
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   let status = $state<ClipboardStatus>('idle');
 * </script>
 *
 * <button
 *   {@attach clipboard({
 *     text: 'Hello, World!',
 *     onStatusChange: (s) => status = s
 *   })}
 * >
 *   {status === 'success' ? '✓ Copied!' :
 *    status === 'failure' ? '✗ Failed' :
 *    '📋 Copy'}
 * </button>
 * ```
 */
export function clipboard(options: ClipboardOptions): Attachment<HTMLElement> {
  return (node: HTMLElement) => {
    const state: ClipboardState = {
      status: "idle",
      timeout: undefined
    };

    const updateStatus = (newStatus: ClipboardStatus) => {
      state.status = newStatus;
      options.onStatusChange?.(newStatus);
    };

    const resetStatus = () => {
      if (state.timeout) {
        clearTimeout(state.timeout);
        state.timeout = undefined;
      }

      const delay = options.delay ?? 2000;

      state.timeout = setTimeout(() => {
        updateStatus("idle");
        state.timeout = undefined;
      }, delay);
    };

    const handleClick = async (event: MouseEvent) => {
      // Prevent default if it's a button inside a form
      if (node.tagName === "BUTTON" && node.closest("form")) {
        event.preventDefault();
      }

      // Clear any existing timeout
      if (state.timeout) {
        clearTimeout(state.timeout);
        state.timeout = undefined;
      }

      try {
        await navigator.clipboard.writeText(options.text);
        updateStatus("success");
        options.onSuccess?.(options.text);
        resetStatus();
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Failed to copy to clipboard");
        updateStatus("failure");
        options.onFailure?.(err);
        resetStatus();
      }
    };

    // Add click listener
    node.addEventListener("click", handleClick);

    // Add appropriate ARIA attributes
    node.setAttribute("role", "button");
    node.setAttribute("aria-label", "Copy to clipboard");

    // Add cursor style if not already set
    if (!node.style.cursor) {
      node.style.cursor = "pointer";
    }

    return () => {
      if (state.timeout) {
        clearTimeout(state.timeout);
      }
      node.removeEventListener("click", handleClick);
      node.removeAttribute("role");
      node.removeAttribute("aria-label");
    };
  };
}

/**
 * Creates a clipboard context with shared state
 * Useful for managing multiple clipboard actions with shared status
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { createClipboardContext } from '$lib/actions/clipboard';
 *
 *   const clipboard = createClipboardContext();
 * </script>
 *
 * <button {@attach clipboard.action({ text: 'Copy me!' })}>
 *   {clipboard.status === 'success' ? 'Copied!' : 'Copy'}
 * </button>
 * ```
 */
export function createClipboardContext(defaultDelay = 2000) {
  let status = $state<ClipboardStatus>("idle");
  let lastCopiedText = $state<string | null>(null);

  const action = (node: HTMLElement, options: Omit<ClipboardOptions, "onStatusChange">) => {
    return clipboard(node, {
      ...options,
      delay: options.delay ?? defaultDelay,
      onStatusChange: (s) => {
        status = s;
        if (s === "success") {
          lastCopiedText = options.text;
        }
      },
      onSuccess: (text) => {
        options.onSuccess?.(text);
      },
      onFailure: (error) => {
        options.onFailure?.(error);
      }
    });
  };

  return {
    get status() {
      return status;
    },
    get lastCopiedText() {
      return lastCopiedText;
    },
    action
  };
}
