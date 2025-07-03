import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createErrorDisplay,
  DynamicComponentError,
  validateComponentSource,
  type DynamicComponentOptions
} from './dynamic-component.js';

describe('validateComponentSource', () => {
  it('should validate empty source', () => {
    const result = validateComponentSource('');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Component source cannot be empty');
  });

  it('should validate valid component', () => {
    const source = `
      <script>
        let count = $state(0);
      </script>
      <p>Count: {count}</p>
    `;
    const result = validateComponentSource(source);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect mismatched script tags', () => {
    const source = `
      <script>
        let count = 0;
      <p>Count: {count}</p>
    `;
    const result = validateComponentSource(source);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Mismatched <script> tags');
  });

  it('should detect mismatched style tags', () => {
    const source = `
      <style>
        p { color: red; }
      <p>Hello</p>
    `;
    const result = validateComponentSource(source);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Mismatched <style> tags');
  });

  it('should ignore HTML comments when validating', () => {
    const source = `
      <script>
        let count = 0;
      </script>
      <!-- This is a comment about </script> -->
      <p>Count: {count}</p>
    `;
    const result = validateComponentSource(source);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate runes usage', () => {
    const source = `
      let count = $state(0);
      <p>Count: {count}</p>
    `;
    const result = validateComponentSource(source);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Runes require a <script> block');
  });
});

describe('createErrorDisplay', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should create error display with message', () => {
    const error = new Error('Test error message');
    createErrorDisplay(error, container);

    expect(container.innerHTML).toContain('Dynamic Component Error:');
    expect(container.innerHTML).toContain('Test error message');
  });

  it('should display cause when available', () => {
    const error = new DynamicComponentError('Main error', 'Root cause');
    createErrorDisplay(error, container);

    expect(container.innerHTML).toContain('Main error');
    expect(container.innerHTML).toContain('Cause: Root cause');
  });

  it('should include proper styling', () => {
    const error = new Error('Test error');
    createErrorDisplay(error, container);

    const errorDiv = container.firstElementChild as HTMLElement;
    expect(errorDiv.style.background).toBe('rgb(254, 226, 226)');
    expect(errorDiv.style.color).toBe('rgb(153, 27, 27)');
    expect(errorDiv.style.fontFamily).toBe('monospace');
  });
});

describe('DynamicComponentError', () => {
  it('should create error with message', () => {
    const error = new DynamicComponentError('Test message');
    
    expect(error.message).toBe('Test message');
    expect(error.name).toBe('DynamicComponentError');
    expect(error.cause).toBeUndefined();
    expect(error.stage).toBeUndefined();
  });

  it('should create error with cause and stage', () => {
    const cause = new Error('Root cause');
    const error = new DynamicComponentError('Test message', cause, 'compilation');
    
    expect(error.message).toBe('Test message');
    expect(error.cause).toBe(cause);
    expect(error.stage).toBe('compilation');
  });

  it('should be instance of Error', () => {
    const error = new DynamicComponentError('Test message');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(DynamicComponentError);
  });
});

describe('createDynamicComponent', () => {
  /*
   * Note: Full integration tests for createDynamicComponent with dynamic imports
   * are challenging in the vitest environment due to blob URL module resolution.
   * The core functionality can be tested through unit tests of the individual
   * components and validation functions above.
   * 
   * For manual testing and integration testing, the createDynamicComponent
   * function should be tested in a browser environment where blob URLs
   * and dynamic imports work as expected.
   */

  it('should throw error for empty component source', async () => {
    const { createDynamicComponent } = await import('./dynamic-component.js');
    
    const options: DynamicComponentOptions = {
      componentSource: '',
      target: document.createElement('div')
    };
    
    await expect(createDynamicComponent(options)).rejects.toThrow(DynamicComponentError);
    await expect(createDynamicComponent(options)).rejects.toThrow('Component source cannot be empty');
  });

  it('should throw error for invalid target', async () => {
    const { createDynamicComponent } = await import('./dynamic-component.js');
    
    const options: DynamicComponentOptions = {
      componentSource: '<p>Hello</p>',
      target: null as any
    };
    
    await expect(createDynamicComponent(options)).rejects.toThrow(DynamicComponentError);
    await expect(createDynamicComponent(options)).rejects.toThrow('Target must be a valid HTMLElement');
  });

  it('should validate options before processing', async () => {
    const { createDynamicComponent } = await import('./dynamic-component.js');
    
    const invalidOptions = [
      {
        componentSource: '   ',
        target: document.createElement('div')
      },
      {
        componentSource: 'valid source',
        target: 'invalid target' as any
      }
    ];

    for (const options of invalidOptions) {
      await expect(createDynamicComponent(options)).rejects.toThrow(DynamicComponentError);
    }
  });
}); 