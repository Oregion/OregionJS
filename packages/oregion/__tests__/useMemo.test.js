import Oregion, { resetHookState, globalState } from "oregion";

describe("useMemo", () => {
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

  test("computes value on first render", () => {
    const factory = jest.fn(() => "computed");
    const value = Oregion.useMemo(factory, []);
    expect(value).toBe("computed");
    expect(factory).toHaveBeenCalledTimes(1);
    expect(fiber.hooks[0].value).toBe("computed");
  });

  test("reuses value if dependencies are unchanged", () => {
    const factory = jest.fn(() => "computed");
    const value1 = Oregion.useMemo(factory, [1, 2]);
    fiber.alternate = { hooks: fiber.hooks };
    fiber.hooks = [];

    resetHookState(fiber);
    const value2 = Oregion.useMemo(factory, [1, 2]);
    expect(value2).toBe("computed");
    expect(factory).toHaveBeenCalledTimes(1); // Not called again
  });

  test("recomputes value when dependencies change", () => {
    const factory = jest.fn((deps) => `computed-${deps}`);
    const value1 = Oregion.useMemo(() => factory("a"), ["a"]);
    expect(value1).toBe("computed-a");
    fiber.alternate = { hooks: fiber.hooks };
    fiber.hooks = [];

    resetHookState(fiber);
    const value2 = Oregion.useMemo(() => factory("b"), ["b"]);
    expect(value2).toBe("computed-b");
    expect(factory).toHaveBeenCalledTimes(2);
  });

  test("handles empty dependencies", () => {
    const factory = jest.fn(() => "static");
    const value1 = Oregion.useMemo(factory, []);
    fiber.alternate = { hooks: fiber.hooks };
    fiber.hooks = [];

    resetHookState(fiber);
    const value2 = Oregion.useMemo(factory, []);
    expect(value2).toBe("static");
    expect(factory).toHaveBeenCalledTimes(1);
  });
});
