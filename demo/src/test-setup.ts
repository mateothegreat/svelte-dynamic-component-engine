import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock URL.createObjectURL and URL.revokeObjectURL for tests
globalThis.URL.createObjectURL = vi.fn(() => "blob:test-url");
globalThis.URL.revokeObjectURL = vi.fn();

// Mock console methods to reduce test noise
globalThis.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn()
};

// Setup DOM environment
Object.defineProperty(window, "location", {
  value: {
    href: "http://localhost:3000"
  },
  writable: true
});

// Create a mock component class for testing
export class MockSvelteComponent {
  public target: HTMLElement;
  public props: any;

  constructor({ target, props }: { target: HTMLElement; props?: any }) {
    this.target = target;
    this.props = props;
    this.render();
  }

  render() {
    if (this.target) {
      this.target.innerHTML = "<div>Mock Dynamic Component</div>";
    }
  }

  $destroy() {
    if (this.target) {
      this.target.innerHTML = "";
    }
  }
}
