import Oregion, { resetHookState, globalState } from "oregion";

describe("useEffect", () => {
  let fiber;
  beforeEach(() => {
    fiber = { hooks: [], alternate: null };
    globalState.wipFiber = fiber;
    globalState.hookIndex = 0;
  });

  test("runs effect on first render", () => {
    const callback = jest.fn();
    Oregion.useEffect(callback, []);
    expect(fiber.hooks[0].effect).toBe(callback);
  });

  test("does not run effect if dependencies are unchanged", () => {
    const callback = jest.fn();
    Oregion.useEffect(callback, [1]);
    fiber.alternate = { hooks: [{ deps: [1] }] };
    fiber.hooks = [];
    resetHookState(fiber);
    Oregion.useEffect(callback, [1]);
    expect(fiber.hooks[0].effect).toBeNull();
  });

  test("runs effect when dependencies change", () => {
    const callback = jest.fn();
    Oregion.useEffect(callback, [1]);
    fiber.alternate = { hooks: [{ deps: [2] }] };
    fiber.hooks = [];
    resetHookState(fiber);
    Oregion.useEffect(callback, [1]);
    expect(fiber.hooks[0].effect).toBe(callback);
  });
});
