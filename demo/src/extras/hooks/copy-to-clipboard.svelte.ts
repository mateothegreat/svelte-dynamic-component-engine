import { toast } from "svelte-sonner";
import type { Attachment } from "svelte/attachments";

/**
 * Configuration options for the copy to clipboard attachment.
 */
export interface CopyToClipboardOptions {
  /** The text to copy to clipboard. If not provided, will use element's textContent */
  text?: string;
  /** Function to get dynamic text content */
  getText?: () => string;
  /** Success message to show in toast */
  successMessage?: string;
  /** Error message to show in toast */
  errorMessage?: string;
  /** Delay before resetting visual state (in milliseconds) */
  resetDelay?: number;
  /** Whether to show toast notifications */
  showToast?: boolean;
  /** Custom CSS classes to apply during different states */
  classes?: {
    idle?: string;
    copying?: string;
    success?: string;
    error?: string;
  };
  /** Whether to prevent default click behavior */
  preventDefault?: boolean;
  /** Custom success callback */
  onSuccess?: (text: string) => void;
  /** Custom error callback */
  onError?: (error: Error) => void;
}

/**
 * Creates a copy to clipboard attachment that can be used with {@attach} directive.
 *
 * ## Usage
 * ```svelte
 * <script>
 *   import { copyToClipboard } from '$lib/hooks/copy-to-clipboard.svelte';
 *
 *   let dynamicText = $state('Hello, World!');
 * </script>
 *
 * <!-- Simple usage - copies element's text content -->
 * <button {@attach copyToClipboard()}>Copy me!</button>
 *
 * <!-- With custom text -->
 * <button {@attach copyToClipboard({ text: 'Custom text to copy' })}>Copy Custom</button>
 *
 * <!-- With dynamic text -->
 * <button {@attach copyToClipboard({ getText: () => dynamicText })}>Copy Dynamic</button>
 *
 * <!-- With custom styling and options -->
 * <button {@attach copyToClipboard({
 *   text: 'npm install my-package',
 *   successMessage: 'Package install command copied! 📦',
 *   classes: {
 *     success: 'bg-green-500 text-white',
 *     copying: 'opacity-50 cursor-wait'
 *   }
 * })}>
 *   Copy Install Command
 * </button>
 * ```
 */
export function copyToClipboard(options: CopyToClipboardOptions = {}): Attachment<HTMLElement> {
  const { text, getText, successMessage = "Copied to clipboard! 📋", errorMessage = "Failed to copy to clipboard", resetDelay = 1000, showToast = true, classes = {}, preventDefault = true, onSuccess, onError } = options;

  return (element: HTMLElement) => {
    let currentState: "idle" | "copying" | "success" | "error" = "idle";
    let resetTimeout: ReturnType<typeof setTimeout> | undefined;
    let originalClasses: string = "";
    let originalCursor: string = "";

    // Store original styles
    const storeOriginalStyles = () => {
      originalClasses = element.className;
      originalCursor = element.style.cursor;
    };

    // Apply state classes
    const applyStateClasses = (state: typeof currentState) => {
      // Reset to original classes
      element.className = originalClasses;

      // Add state-specific classes
      if (classes[state]) {
        element.className += ` ${classes[state]}`;
      }

      // Update cursor for copying state
      if (state === "copying") {
        element.style.cursor = "wait";
      } else {
        element.style.cursor = originalCursor;
      }
    };

    // Set up initial state
    const initialize = () => {
      storeOriginalStyles();

      // Make element appear interactive if it's not already
      if (!element.style.cursor && element.tagName !== "BUTTON") {
        element.style.cursor = "pointer";
      }

      // Add role for accessibility
      if (!element.getAttribute("role")) {
        element.setAttribute("role", "button");
      }

      // Add aria-label for accessibility
      if (!element.getAttribute("aria-label")) {
        element.setAttribute("aria-label", "Copy to clipboard");
      }
    };

    // Get text to copy
    const getTextToCopy = (): string => {
      if (getText) {
        return getText();
      }
      if (text) {
        return text;
      }
      return element.textContent?.trim() || "";
    };

    // Handle copy operation
    const handleCopy = async (event: Event) => {
      if (preventDefault) {
        event.preventDefault();
      }

      // Prevent multiple simultaneous copies
      if (currentState === "copying") {
        return;
      }

      const textToCopy = getTextToCopy();

      if (!textToCopy) {
        console.warn("copyToClipboard: No text to copy");
        return;
      }

      // Clear any existing timeout
      if (resetTimeout) {
        clearTimeout(resetTimeout);
      }

      // Set copying state
      currentState = "copying";
      applyStateClasses("copying");

      try {
        // Check if clipboard API is available
        if (!navigator.clipboard) {
          throw new Error("Clipboard API not available");
        }

        await navigator.clipboard.writeText(textToCopy);

        // Success state
        currentState = "success";
        applyStateClasses("success");

        if (showToast) {
          toast.success(successMessage);
        }

        if (onSuccess) {
          onSuccess(textToCopy);
        }
      } catch (error) {
        // Error state
        currentState = "error";
        applyStateClasses("error");

        const errorObj = error instanceof Error ? error : new Error("Unknown error");

        if (showToast) {
          toast.error(errorMessage);
        }

        if (onError) {
          onError(errorObj);
        } else {
          console.error("copyToClipboard error:", errorObj);
        }
      } finally {
        // Reset to idle state after delay
        resetTimeout = setTimeout(() => {
          currentState = "idle";
          applyStateClasses("idle");
        }, resetDelay);
      }
    };

    // Set up event listeners
    const setupEventListeners = () => {
      element.addEventListener("click", handleCopy);

      // Add keyboard support for accessibility
      element.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          handleCopy(event);
        }
      });

      // Add visual feedback for hover/focus states
      element.addEventListener("mouseenter", () => {
        if (currentState === "idle") {
          element.style.opacity = "0.8";
        }
      });

      element.addEventListener("mouseleave", () => {
        if (currentState === "idle") {
          element.style.opacity = "";
        }
      });
    };

    // Initialize
    initialize();
    setupEventListeners();

    // Cleanup function
    return () => {
      if (resetTimeout) {
        clearTimeout(resetTimeout);
      }

      element.removeEventListener("click", handleCopy);
      element.style.cursor = originalCursor;
      element.className = originalClasses;
    };
  };
}

/**
 * Creates a copy button attachment with predefined styling and behavior.
 * Perfect for code blocks and similar use cases.
 *
 * ## Usage
 * ```svelte
 * <script>
 *   import { copyButton } from '$lib/hooks/copy-to-clipboard.svelte';
 *
 *   let code = $state('npm install @mateothegreat/svelte-dynamic-component-engine');
 * </script>
 *
 * <div class="relative">
 *   <pre class="bg-gray-900 text-white p-4 rounded overflow-x-auto">
 *     <code>{code}</code>
 *   </pre>
 *   <button
 *     {@attach copyButton({
 *       getText: () => code,
 *       successMessage: 'Install command copied! 📦'
 *     })}
 *     class="absolute top-2 right-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
 *   >
 *     Copy
 *   </button>
 * </div>
 * ```
 */
export function copyButton(options: CopyToClipboardOptions = {}): Attachment<HTMLElement> {
  return copyToClipboard({
    classes: {
      idle: "transition-all duration-200",
      copying: "opacity-50 cursor-wait scale-95",
      success: "bg-green-500 text-white scale-105",
      error: "bg-red-500 text-white"
    },
    ...options
  });
}

/**
 * Creates a copy attachment specifically designed for code blocks.
 * Automatically finds and copies the code content.
 *
 * ## Usage
 * ```svelte
 * <script>
 *   import { copyCodeBlock } from '$lib/hooks/copy-to-clipboard.svelte';
 * </script>
 *
 * <pre {@attach copyCodeBlock()}>
 *   <code>console.log('Hello, World!');</code>
 * </pre>
 * ```
 */
export function copyCodeBlock(options: Omit<CopyToClipboardOptions, "getText" | "text"> = {}): Attachment<HTMLElement> {
  return copyToClipboard({
    getText: () => {
      const codeElement = document.activeElement?.querySelector("code") || document.activeElement?.closest("pre")?.querySelector("code");
      return codeElement?.textContent?.trim() || "";
    },
    successMessage: "Code copied to clipboard! 👨‍💻",
    classes: {
      idle: "cursor-pointer transition-all duration-200",
      copying: "opacity-50",
      success: "bg-green-100 border border-green-300",
      error: "bg-red-100 border border-red-300"
    },
    ...options
  });
}
