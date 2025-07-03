// src/lib/actions/clipboard.test.ts

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clipboard, createClipboardContext } from "./clipboard";

// Mock navigator.clipboard
const mockWriteText = vi.fn();
Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: mockWriteText
  },
  writable: true
});

describe("clipboard attachment action", () => {
  let element: HTMLButtonElement;

  beforeEach(() => {
    element = document.createElement("button");
    document.body.appendChild(element);
    vi.useFakeTimers();
    mockWriteText.mockClear();
  });

  afterEach(() => {
    document.body.removeChild(element);
    vi.useRealTimers();
  });

  it("should copy text to clipboard on click", async () => {
    const text = "Hello, World!";
    const onSuccess = vi.fn();

    mockWriteText.mockResolvedValueOnce(undefined);

    const action = clipboard(element, {
      text,
      onSuccess
    });

    // Simulate click
    element.click();

    await vi.waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(text);
      expect(onSuccess).toHaveBeenCalledWith(text);
    });

    action.destroy();
  });

  it("should handle copy failure", async () => {
    const text = "Failed text";
    const onFailure = vi.fn();
    const error = new Error("Clipboard access denied");

    mockWriteText.mockRejectedValueOnce(error);

    const action = clipboard(element, {
      text,
      onFailure
    });

    element.click();

    await vi.waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(text);
      expect(onFailure).toHaveBeenCalledWith(error);
    });

    action.destroy();
  });

  it("should update status through onStatusChange callback", async () => {
    const text = "Status test";
    const onStatusChange = vi.fn();

    mockWriteText.mockResolvedValueOnce(undefined);

    const action = clipboard(element, {
      text,
      onStatusChange
    });

    element.click();

    await vi.waitFor(() => {
      expect(onStatusChange).toHaveBeenCalledWith("success");
    });

    // Fast forward to check status reset
    vi.advanceTimersByTime(2000);

    expect(onStatusChange).toHaveBeenCalledWith("idle");

    action.destroy();
  });

  it("should use custom delay for status reset", async () => {
    const text = "Custom delay";
    const onStatusChange = vi.fn();
    const customDelay = 500;

    mockWriteText.mockResolvedValueOnce(undefined);

    const action = clipboard(element, {
      text,
      delay: customDelay,
      onStatusChange
    });

    element.click();

    await vi.waitFor(() => {
      expect(onStatusChange).toHaveBeenCalledWith("success");
    });

    // Advance less than custom delay - status should not reset
    vi.advanceTimersByTime(400);
    expect(onStatusChange).toHaveBeenCalledTimes(1);

    // Advance past custom delay - status should reset
    vi.advanceTimersByTime(100);
    expect(onStatusChange).toHaveBeenCalledWith("idle");

    action.destroy();
  });

  it("should clear previous timeout on rapid clicks", async () => {
    const text = "Rapid clicks";
    const onStatusChange = vi.fn();

    mockWriteText.mockResolvedValue(undefined);

    const action = clipboard(element, {
      text,
      delay: 1000,
      onStatusChange
    });

    // First click
    element.click();
    await vi.waitFor(() => {
      expect(onStatusChange).toHaveBeenCalledWith("success");
    });

    // Advance 500ms
    vi.advanceTimersByTime(500);

    // Second click before timeout
    onStatusChange.mockClear();
    element.click();

    await vi.waitFor(() => {
      expect(onStatusChange).toHaveBeenCalledWith("success");
    });

    // Advance 1500ms total - should only have one idle call
    vi.advanceTimersByTime(1000);
    expect(onStatusChange).toHaveBeenCalledWith("idle");
    expect(onStatusChange).toHaveBeenCalledTimes(2); // success + idle

    action.destroy();
  });

  it("should add appropriate ARIA attributes", () => {
    const action = clipboard(element, {
      text: "ARIA test"
    });

    expect(element.getAttribute("role")).toBe("button");
    expect(element.getAttribute("aria-label")).toBe("Copy to clipboard");
    expect(element.style.cursor).toBe("pointer");

    action.destroy();

    expect(element.getAttribute("role")).toBeNull();
    expect(element.getAttribute("aria-label")).toBeNull();
  });

  it("should prevent default for buttons inside forms", async () => {
    const form = document.createElement("form");
    const button = document.createElement("button");
    form.appendChild(button);
    document.body.appendChild(form);

    mockWriteText.mockResolvedValueOnce(undefined);

    const action = clipboard(button, {
      text: "Form button test"
    });

    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    const preventDefault = vi.spyOn(event, "preventDefault");

    button.dispatchEvent(event);

    expect(preventDefault).toHaveBeenCalled();

    action.destroy();
    document.body.removeChild(form);
  });

  it("should handle update method", () => {
    const initialText = "Initial";
    const updatedText = "Updated";
    const onStatusChange = vi.fn();

    mockWriteText.mockResolvedValue(undefined);

    const action = clipboard(element, {
      text: initialText,
      onStatusChange
    });

    // Update the action
    action.update({
      text: updatedText,
      onStatusChange
    });

    element.click();

    // Should use updated text
    expect(mockWriteText).toHaveBeenCalledWith(updatedText);

    action.destroy();
  });

  it("should convert non-Error objects to Error instances", async () => {
    const text = "Error conversion test";
    const onFailure = vi.fn();

    // Reject with a string instead of Error
    mockWriteText.mockRejectedValueOnce("Not an error object");

    const action = clipboard(element, {
      text,
      onFailure
    });

    element.click();

    await vi.waitFor(() => {
      expect(onFailure).toHaveBeenCalled();
      const error = onFailure.mock.calls[0][0];
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Failed to copy to clipboard");
    });

    action.destroy();
  });
});

describe("createClipboardContext", () => {
  let element: HTMLButtonElement;

  beforeEach(() => {
    element = document.createElement("button");
    document.body.appendChild(element);
    vi.useFakeTimers();
    mockWriteText.mockClear();
  });

  afterEach(() => {
    document.body.removeChild(element);
    vi.useRealTimers();
  });

  it("should create a clipboard context with shared state", async () => {
    const context = createClipboardContext();

    expect(context.status).toBe("idle");
    expect(context.lastCopiedText).toBeNull();

    mockWriteText.mockResolvedValueOnce(undefined);

    const action = context.action(element, {
      text: "Context test"
    });

    element.click();

    await vi.waitFor(() => {
      expect(context.status).toBe("success");
      expect(context.lastCopiedText).toBe("Context test");
    });

    action.destroy();
  });

  it("should use default delay from context", async () => {
    const customDelay = 300;
    const context = createClipboardContext(customDelay);

    mockWriteText.mockResolvedValueOnce(undefined);

    const action = context.action(element, {
      text: "Delay test"
    });

    element.click();

    await vi.waitFor(() => {
      expect(context.status).toBe("success");
    });

    // Should reset after custom delay
    vi.advanceTimersByTime(customDelay);
    expect(context.status).toBe("idle");

    action.destroy();
  });

  it("should override context delay with action-specific delay", async () => {
    const contextDelay = 1000;
    const actionDelay = 200;
    const context = createClipboardContext(contextDelay);

    mockWriteText.mockResolvedValueOnce(undefined);

    const action = context.action(element, {
      text: "Override delay",
      delay: actionDelay
    });

    element.click();

    await vi.waitFor(() => {
      expect(context.status).toBe("success");
    });

    // Should use action-specific delay
    vi.advanceTimersByTime(actionDelay);
    expect(context.status).toBe("idle");

    action.destroy();
  });

  it("should propagate callbacks from context action", async () => {
    const context = createClipboardContext();
    const onSuccess = vi.fn();
    const onFailure = vi.fn();

    // Test success callback
    mockWriteText.mockResolvedValueOnce(undefined);

    const successAction = context.action(element, {
      text: "Success callback",
      onSuccess
    });

    element.click();

    await vi.waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith("Success callback");
    });

    successAction.destroy();

    // Test failure callback
    const error = new Error("Test error");
    mockWriteText.mockRejectedValueOnce(error);

    const failureAction = context.action(element, {
      text: "Failure callback",
      onFailure
    });

    element.click();

    await vi.waitFor(() => {
      expect(onFailure).toHaveBeenCalledWith(error);
    });

    failureAction.destroy();
  });

  it("should handle multiple actions with shared state", async () => {
    const context = createClipboardContext();
    const button1 = document.createElement("button");
    const button2 = document.createElement("button");
    document.body.appendChild(button1);
    document.body.appendChild(button2);

    mockWriteText.mockResolvedValue(undefined);

    const action1 = context.action(button1, { text: "Button 1" });
    const action2 = context.action(button2, { text: "Button 2" });

    // Click first button
    button1.click();

    await vi.waitFor(() => {
      expect(context.status).toBe("success");
      expect(context.lastCopiedText).toBe("Button 1");
    });

    // Click second button
    button2.click();

    await vi.waitFor(() => {
      expect(context.lastCopiedText).toBe("Button 2");
    });

    action1.destroy();
    action2.destroy();
    document.body.removeChild(button1);
    document.body.removeChild(button2);
  });
});
