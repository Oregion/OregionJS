import Oregion, { resetHookState, globalState } from "oregion";

describe("useState", () => {
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

  test("initializes state with initial value", () => {
    const [state] = Oregion.useState(42);
    expect(state).toBe(42);
    expect(fiber.hooks[0].state).toBe(42);
  });

  test("updates state when setState is called", () => {
    const [state, setState] = Oregion.useState(0);
    setState((prev) => prev + 1);
    expect(fiber.hooks[0].queue).toHaveLength(1);
    expect(fiber.hooks[0].queue[0](0)).toBe(1);
  });

  test("maintains state across renders", () => {
    const [state1, setState] = Oregion.useState(0);
    setState(42);
    fiber.alternate = { hooks: fiber.hooks };
    fiber.hooks = [];

    resetHookState(fiber);
    const [state2] = Oregion.useState(0);
    expect(state2).toBe(42);
  });
});
