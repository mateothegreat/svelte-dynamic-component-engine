# Svelte Dynamic Component Engine - Usage Guide

## Overview

The Svelte Dynamic Component Engine now supports both file-based and string-based compilation of Svelte components. This allows you to compile Svelte components directly from source code strings without requiring physical files on the filesystem.

## Installation

```bash
npm install @mateothegreat/dynamic-component-engine
```

## API Reference

### Types

```typescript
interface ComponentSource {
  name: string;           // Component name
  source: string;         // Component source code
  filename?: string;      // Optional custom filename
  type?: 'svelte' | 'ts' | 'js'; // Component type (auto-detected if not specified)
}

interface CompilerOptions {
  output: string;         // Output directory
  target: string;         // Build target (default: 'esnext')
  format: string;         // Output format (default: 'esm')
  debug: boolean;         // Enable debug logging
  banner: string;         // Banner text for compiled files
}
```

## String-Based Compilation

### Single Component

```typescript
import { compileComponentFromSource } from '@mateothegreat/dynamic-component-engine/compiler';

const svelteSource = `
<script lang="ts">
  export let name: string = 'World';
  export let count: number = 0;
</script>

<h1>Hello {name}!</h1>
<p>Count: {count}</p>
<button on:click={() => count++}>Increment</button>

<style>
  h1 {
    color: blue;
    font-family: Arial, sans-serif;
  }
  
  button {
    background: #ff3e00;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }
</style>
`;

const result = await compileComponentFromSource(
  'HelloComponent',
  svelteSource,
  {
    output: './dist',
    target: 'esnext',
    format: 'esm',
    debug: true,
    banner: '// Compiled with Svelte Dynamic Component Engine'
  },
  'svelte' // Component type (optional, auto-detected)
);

console.log('Compiled files:', result?.length);
```

### Multiple Components

```typescript
import { compileComponentsFromSource } from '@mateothegreat/dynamic-component-engine/compiler';

const components = [
  {
    name: 'Button',
    source: `
<script>
  export let variant = 'primary';
  export let disabled = false;
</script>

<button class="btn btn-{variant}" {disabled}>
  <slot />
</button>

<style>
  .btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .btn-primary {
    background: #007bff;
    color: white;
  }
  
  .btn-secondary {
    background: #6c757d;
    color: white;
  }
</style>
    `,
    type: 'svelte'
  },
  {
    name: 'Card',
    source: `
<script>
  export let title = '';
</script>

<div class="card">
  <h3 class="card-title">{title}</h3>
  <div class="card-content">
    <slot />
  </div>
</div>

<style>
  .card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
    margin: 16px 0;
  }
  
  .card-title {
    margin: 0 0 12px 0;
    color: #333;
  }
</style>
    `,
    type: 'svelte'
  }
];

const results = await compileComponentsFromSource(components, {
  output: './dist/components',
  target: 'esnext',
  format: 'esm',
  debug: false,
  banner: ''
});

console.log(`Compiled ${results?.length} component files`);
```

## File-Based Compilation (Backward Compatible)

### CLI Usage

```bash
# Compile components from files
node src/compiler.ts --input="src/components/**/*.svelte" --output="./dist" --debug

# With custom options
node src/compiler.ts \
  --input="src/components/**/*.svelte" \
  --output="./public/components" \
  --target="es2020" \
  --format="esm" \
  --banner="// My Custom Banner" \
  --debug
```

### Programmatic Usage

```typescript
import { bundleSvelteFromFiles } from '@mateothegreat/dynamic-component-engine/compiler';

// Single file
const result = await bundleSvelteFromFiles(
  'src/components/MyComponent.svelte',
  {
    input: '', // Not used for file-based compilation
    output: './dist',
    target: 'esnext',
    format: 'esm',
    debug: true,
    banner: '// Compiled component'
  }
);

// Multiple files
const results = await bundleSvelteFromFiles(
  ['src/components/Button.svelte', 'src/components/Card.svelte'],
  options
);
```

## Advanced Usage

### Dynamic Component Loading

After compilation, you can dynamically load and use your components:

```typescript
// Assuming you've compiled a component and it's available
const componentModule = await import('./dist/HelloComponent.js');
const componentFactory = componentModule.default;

// Mount the component
const rendered = componentFactory(
  document.getElementById('app'), // target element
  { name: 'Svelte', count: 5 }    // props
);

// Later, destroy the component
rendered.destroy();
```

### Runtime Component Generation

```typescript
// Generate component source dynamically
function generateComponentSource(componentName: string, props: string[]): string {
  const propsDeclaration = props.map(prop => `export let ${prop};`).join('\n  ');
  const propsDisplay = props.map(prop => `<p>{${prop}}</p>`).join('\n  ');
  
  return `
<script>
  ${propsDeclaration}
</script>

<div class="dynamic-component">
  <h2>${componentName}</h2>
  ${propsDisplay}
</div>

<style>
  .dynamic-component {
    padding: 16px;
    border: 2px solid #ff3e00;
    border-radius: 8px;
  }
</style>
  `;
}

// Compile the dynamically generated component
const dynamicSource = generateComponentSource('UserCard', ['name', 'email', 'role']);
const result = await compileComponentFromSource('UserCard', dynamicSource, options);
```

### Error Handling

```typescript
try {
  const result = await compileComponentFromSource('MyComponent', source, options);
  
  if (!result || result.length === 0) {
    console.error('Compilation failed: No output files generated');
    return;
  }
  
  console.log('Compilation successful:', result.map(f => f.path));
} catch (error) {
  console.error('Compilation error:', error.message);
  
  if (error.errors) {
    error.errors.forEach(err => {
      console.error(`  ${err.location?.file}:${err.location?.line} - ${err.text}`);
    });
  }
}
```

## Configuration Options

### Build Targets

- `'es5'` - ES5 compatible output
- `'es2015'` - ES2015/ES6 compatible output
- `'es2017'` - ES2017 compatible output (default for most use cases)
- `'es2020'` - ES2020 compatible output
- `'esnext'` - Latest ECMAScript features (default)

### Output Formats

- `'esm'` - ES modules (default, recommended)
- `'cjs'` - CommonJS modules

### Debug Mode

When `debug: true` is enabled:
- Detailed build logs are shown
- Compilation timing information
- Plugin processing details
- Source map generation (if supported)

## Best Practices

1. **Component Naming**: Use PascalCase for component names (`MyComponent`, not `myComponent`)

2. **Type Safety**: Explicitly specify component type when known:
   ```typescript
   const component = { name: 'Button', source: '...', type: 'svelte' as const };
   ```

3. **Error Boundaries**: Always wrap compilation in try-catch blocks

4. **Performance**: For batch compilation, use `compileComponentsFromSource` instead of multiple `compileComponentFromSource` calls

5. **Memory Management**: Remember to call `destroy()` on rendered components to prevent memory leaks

## Troubleshooting

### Common Issues

**Issue**: `Expected ">" but found "lang"`
**Solution**: Ensure component type is set to `'svelte'` or let auto-detection work by including Svelte syntax in the source.

**Issue**: `Virtual file not found`
**Solution**: This usually indicates a problem with the virtual file system. Use the new string-based compilation which uses `stdin` instead.

**Issue**: CSS not being injected
**Solution**: Ensure `css: "injected"` is set in the Svelte compiler options (this is the default in the new version).

### Debug Information

Enable debug mode to get detailed information about the compilation process:

```typescript
const result = await compileComponentFromSource(name, source, {
  ...options,
  debug: true
});
```

This will show:
- Component detection results
- Build configuration
- Plugin execution order
- Compilation timing
- Output file details