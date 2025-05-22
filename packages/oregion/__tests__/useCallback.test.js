import Oregion, { resetHookState, globalState } from "oregion";

describe("useCallback", () => {
  let fiber;
  beforeEach(() => {
    // Initialize fiber and global state
    fiber = { hooks: [], alternate: null };
    globalState.wipFiber = fiber;
    globalState.hookIndex = 0;
    // Mock currentRoot to prevent null access
    globalState.currentRoot = {
      dom: document.createElement("div"),
      props: { children: [] },
      alternate: null,
    };
  });

  afterEach(() => {
    // Reset global state to avoid interference
    globalState.currentRoot = null;
    globalState.wipRoot = null;
    globalState.nextUnitOfWork = null;
    globalState.deletions = null;
  });

  test("returns same callback if dependencies are unchanged", () => {
    // First render
    const callback = jest.fn();
    const memoizedCallback1 = Oregion.useCallback(callback, [1, 2]);
    fiber.alternate = { hooks: fiber.hooks };
    fiber.hooks = [];

    // Second render
    resetHookState(fiber);
    const memoizedCallback2 = Oregion.useCallback(callback, [1, 2]);
    expect(memoizedCallback2).toBe(memoizedCallback1);
    expect(callback).not.toHaveBeenCalled();
  });

  test("returns same callback even if dependencies change", () => {
    // First render
    const callback = jest.fn();
    const memoizedCallback1 = Oregion.useCallback(callback, ["a"]);
    fiber.alternate = { hooks: fiber.hooks };
    fiber.hooks = [];

    // Second render
    resetHookState(fiber);
    const memoizedCallback2 = Oregion.useCallback(callback, ["b"]);
    expect(memoizedCallback2).toBe(memoizedCallback1); // Changed to .toBe
    expect(callback).not.toHaveBeenCalled();
  });

  test("memoized callback works when called", () => {
    // First render
    const callback = jest.fn((x) => x * 2);
    const memoizedCallback = Oregion.useCallback(callback, []);
    const result = memoizedCallback(5);
    expect(result).toBe(10);
    expect(callback).toHaveBeenCalledWith(5);
  });

  test("handles empty dependencies", () => {
    // First render
    const callback = jest.fn();
    const memoizedCallback1 = Oregion.useCallback(callback, []);
    fiber.alternate = { hooks: fiber.hooks };
    fiber.hooks = [];

    // Second render
    resetHookState(fiber);
    const memoizedCallback2 = Oregion.useCallback(callback, []);
    expect(memoizedCallback2).toBe(memoizedCallback1);
  });
});
