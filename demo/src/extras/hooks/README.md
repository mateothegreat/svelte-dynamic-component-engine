# Copy to Clipboard Attachment

A modern, flexible copy to clipboard implementation for Svelte 5 using the new `{@attach}` directive. This replaces the previous class-based approach with a more declarative and feature-rich solution.

## Features

- ✨ **Declarative**: Use `{@attach}` directly on any element
- 🎯 **Flexible**: Copy element content, custom text, or dynamic/reactive text
- 🎨 **Visual feedback**: Customizable CSS classes for different states
- ♿ **Accessible**: Built-in keyboard support and ARIA attributes
- 🔄 **Reactive**: Automatically updates when state changes
- 🍞 **Toast integration**: Built-in toast notifications with svelte-sonner
- 🎛️ **Configurable**: Extensive customization options
- 🚀 **TypeScript**: Full type safety and IntelliSense support

## Installation

```bash
npm install svelte-sonner  # For toast notifications
```

## Basic Usage

### Simple Copy (copies element content)

```svelte
<script>
  import { copyToClipboard } from '$lib/hooks/copy-to-clipboard.svelte';
</script>

<div {@attach copyToClipboard()}>
  Click me to copy this text!
</div>
```

### Copy with Custom Text

```svelte
<button {@attach copyToClipboard({ 
  text: 'Custom text to copy',
  successMessage: 'Custom text copied! 🎉'
})}>
  Copy Custom Text
</button>
```

### Dynamic/Reactive Copy

```svelte
<script>
  let dynamicText = $state('Hello, World!');
</script>

<button {@attach copyToClipboard({ 
  getText: () => dynamicText,
  successMessage: 'Dynamic text copied! 🔄'
})}>
  Copy: {dynamicText}
</button>
```

## Advanced Usage

### Pre-styled Copy Button

```svelte
<script>
  import { copyButton } from '$lib/hooks/copy-to-clipboard.svelte';
</script>

<button {@attach copyButton({ 
  text: 'npm install my-package',
  successMessage: 'Install command copied! 📦'
})}>
  Copy Install Command
</button>
```

### Code Block Copy

```svelte
<script>
  import { copyCodeBlock } from '$lib/hooks/copy-to-clipboard.svelte';
</script>

<pre {@attach copyCodeBlock()}>
  <code>console.log('Hello, World!');</code>
</pre>
```

### Custom Styling and Behavior

```svelte
<button {@attach copyToClipboard({
  text: 'Important data',
  successMessage: 'Data copied successfully! ✅',
  errorMessage: 'Failed to copy data ❌',
  resetDelay: 2000,
  classes: {
    idle: 'bg-blue-500 text-white',
    copying: 'bg-yellow-500 opacity-50 cursor-wait',
    success: 'bg-green-500 text-white scale-110',
    error: 'bg-red-500 text-white'
  },
  onSuccess: (text) => console.log('Copied:', text),
  onError: (error) => console.error('Copy failed:', error)
})}>
  Copy Important Data
</button>
```

## API Reference

### `copyToClipboard(options?)`

Creates a copy to clipboard attachment.

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `text` | `string` | `undefined` | Static text to copy |
| `getText` | `() => string` | `undefined` | Function to get dynamic text |
| `successMessage` | `string` | `'Copied to clipboard! 📋'` | Success toast message |
| `errorMessage` | `string` | `'Failed to copy to clipboard'` | Error toast message |
| `resetDelay` | `number` | `1000` | Delay before resetting state (ms) |
| `showToast` | `boolean` | `true` | Whether to show toast notifications |
| `classes` | `object` | `{}` | Custom CSS classes for states |
| `preventDefault` | `boolean` | `true` | Prevent default click behavior |
| `onSuccess` | `(text: string) => void` | `undefined` | Success callback |
| `onError` | `(error: Error) => void` | `undefined` | Error callback |

#### Classes Object

```typescript
{
  idle?: string;     // Default state
  copying?: string;  // While copying
  success?: string;  // After successful copy
  error?: string;    // After copy failure
}
```

### `copyButton(options?)`

Pre-configured copy button with smooth animations.

```svelte
<button {@attach copyButton({ 
  text: 'Text to copy',
  successMessage: 'Copied!'
})}>
  Copy
</button>
```

### `copyCodeBlock(options?)`

Specialized attachment for code blocks that automatically finds and copies code content.

```svelte
<pre {@attach copyCodeBlock()}>
  <code>Your code here</code>
</pre>
```

## Migration from UseClipboard Class

### Before (Class-based)

```svelte
<script>
  import { UseClipboard } from '$lib/hooks/use-clipboard.svelte';
  
  const clipboard = new UseClipboard();
</script>

<button onclick={() => clipboard.copy('Hello, World!')}>
  {#if clipboard.copied}
    Copied!
  {:else}
    Copy
  {/if}
</button>
```

### After (Attachment-based)

```svelte
<script>
  import { copyToClipboard } from '$lib/hooks/copy-to-clipboard.svelte';
</script>

<button {@attach copyToClipboard({ 
  text: 'Hello, World!',
  successMessage: 'Copied! 🎉'
})}>
  Copy
</button>
```

## Benefits of the New Approach

1. **More Declarative**: Attach directly to elements instead of managing class instances
2. **Better Performance**: No need to track state in multiple places
3. **Easier to Use**: Less boilerplate code
4. **More Flexible**: Works with any element, not just buttons
5. **Better Accessibility**: Automatically adds ARIA attributes and keyboard support
6. **Visual Feedback**: Built-in state management with customizable styling
7. **Reactive**: Automatically updates when dependencies change

## Browser Support

- Modern browsers with Clipboard API support
- Graceful fallback with error handling for unsupported browsers
- Requires HTTPS in production (Clipboard API requirement)

## Examples

See `demo/src/components/copy-demo.svelte` for comprehensive usage examples.

## TypeScript Support

Full TypeScript support with proper type definitions:

```typescript
import type { Attachment } from 'svelte/attachments';
import { copyToClipboard, type CopyToClipboardOptions } from '$lib/hooks/copy-to-clipboard.svelte';

const myAttachment: Attachment<HTMLElement> = copyToClipboard({
  text: 'Typed text',
  onSuccess: (text: string) => console.log('Copied:', text)
});
``` 