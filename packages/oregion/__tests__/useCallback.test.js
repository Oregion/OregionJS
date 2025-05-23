import Oregion, { resetHookState, globalState } from "oregion";

describe("useCallback", () => {
  let fiber;
  beforeEach(() => {
    fiber = { hooks: [], alternate: null };
    globalState.wipFiber = fiber;
    globalState.hookIndex = 0;
    globalState.currentRoot = {
      dom: document.createElement("div"),
      props: { children: [] },
      alternate: null,
    };
  });

  afterEach(() => {
    globalState.currentRoot = null;
    globalState.wipRoot = null;
    globalState.nextUnitOfWork = null;
    globalState.deletions = null;
  });

  test("returns same callback if dependencies are unchanged", () => {
    const callback = jest.fn();
    const memoizedCallback1 = Oregion.useCallback(callback, [1, 2]);
    fiber.alternate = { hooks: fiber.hooks };
    fiber.hooks = [];

    resetHookState(fiber);
    const memoizedCallback2 = Oregion.useCallback(callback, [1, 2]);
    expect(memoizedCallback2).toBe(memoizedCallback1);
    expect(callback).not.toHaveBeenCalled();
  });

  test("returns same callback even if dependencies change", () => {
    const callback = jest.fn();
    const memoizedCallback1 = Oregion.useCallback(callback, ["a"]);
    fiber.alternate = { hooks: fiber.hooks };
    fiber.hooks = [];

    resetHookState(fiber);
    const memoizedCallback2 = Oregion.useCallback(callback, ["b"]);
    expect(memoizedCallback2).toBe(memoizedCallback1); // Changed to .toBe
    expect(callback).not.toHaveBeenCalled();
  });

  test("memoized callback works when called", () => {
    const callback = jest.fn((x) => x * 2);
    const memoizedCallback = Oregion.useCallback(callback, []);
    const result = memoizedCallback(5);
    expect(result).toBe(10);
    expect(callback).toHaveBeenCalledWith(5);
  });

  test("handles empty dependencies", () => {
    const callback = jest.fn();
    const memoizedCallback1 = Oregion.useCallback(callback, []);
    fiber.alternate = { hooks: fiber.hooks };
    fiber.hooks = [];

    resetHookState(fiber);
    const memoizedCallback2 = Oregion.useCallback(callback, []);
    expect(memoizedCallback2).toBe(memoizedCallback1);
  });
});
