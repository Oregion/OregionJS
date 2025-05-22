import Oregion, { resetHookState, globalState } from "oregion";

describe("useRef", () => {
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

  test("initializes ref with initial value", () => {
    const ref = Oregion.useRef(42);
    expect(ref.current).toBe(42);
    expect(fiber.hooks[0].current).toBe(42);
  });

  test("persists ref value across renders", () => {
    const ref = Oregion.useRef("initial");
    ref.current = "updated";
    fiber.alternate = { hooks: fiber.hooks };
    fiber.hooks = [];

    resetHookState(fiber);
    const ref2 = Oregion.useRef("new");
    expect(ref2.current).toBe("updated");
  });

  test("maintains separate refs in the same component", () => {
    const ref1 = Oregion.useRef(1);
    const ref2 = Oregion.useRef(2);
    expect(ref1.current).toBe(1);
    expect(ref2.current).toBe(2);
    expect(fiber.hooks[0].current).toBe(1);
    expect(fiber.hooks[1].current).toBe(2);

    ref1.current = 10;
    ref2.current = 20;
    fiber.alternate = { hooks: fiber.hooks };
    fiber.hooks = [];

    resetHookState(fiber);
    const ref1b = Oregion.useRef(100);
    const ref2b = Oregion.useRef(200);
    expect(ref1b.current).toBe(10);
    expect(ref2b.current).toBe(20);
  });
});
