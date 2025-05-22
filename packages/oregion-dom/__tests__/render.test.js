import OregionDOM, { workLoop } from "oregion-dom";
import Oregion, { globalState } from "oregion";

describe("render", () => {
  let container;
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    jest.useFakeTimers();
    globalState.currentRoot = null;
    globalState.wipRoot = null;
    globalState.nextUnitOfWork = null;
    globalState.deletions = [];
  });

  afterEach(() => {
    document.body.removeChild(container);
    jest.clearAllTimers();
    globalState.currentRoot = null;
    globalState.wipRoot = null;
    globalState.nextUnitOfWork = null;
    globalState.deletions = [];
  });

  test("renders a simple element", () => {
    const element = Oregion.createElement("div", { id: "test" }, "Hello");
    OregionDOM.render(element, container);

    let iterations = 0;
    const maxIterations = 100;
    while (globalState.nextUnitOfWork && iterations < maxIterations) {
      console.log("Test Iteration:", iterations, "nextUnitOfWork:", globalState.nextUnitOfWork?._debugName);
      workLoop({ timeRemaining: () => 50 });
      jest.advanceTimersByTime(1);
      iterations++;
      if (iterations === maxIterations) {
        console.error("Max iterations reached, possible infinite loop");
        break;
      }
    }

    if (!globalState.nextUnitOfWork && globalState.wipRoot) {
      console.log("Test: Manually committing root");
      const commitRoot = require("oregion-dom").commitRoot;
      commitRoot();
    }

    console.log("Container innerHTML:", container.innerHTML);
    console.log("globalState.currentRoot:", globalState.currentRoot);
    console.log("globalState.wipRoot:", globalState.wipRoot);

    expect(container.querySelector("#test")).toHaveTextContent("Hello");
  });

  test("renders nested elements", () => {
    const element = Oregion.createElement("div", null, Oregion.createElement("span", null, "Nested"));
    OregionDOM.render(element, container);

    let iterations = 0;
    const maxIterations = 100;
    while (globalState.nextUnitOfWork && iterations < maxIterations) {
      console.log("Test Iteration:", iterations, "nextUnitOfWork:", globalState.nextUnitOfWork?._debugName);
      workLoop({ timeRemaining: () => 50 });
      jest.advanceTimersByTime(1);
      iterations++;
      if (iterations === maxIterations) {
        console.error("Max iterations reached, possible infinite loop");
        break;
      }
    }

    if (!globalState.nextUnitOfWork && globalState.wipRoot) {
      console.log("Test: Manually committing root");
      const commitRoot = require("oregion-dom").commitRoot;
      commitRoot();
    }

    expect(container.querySelector("div > span")).toHaveTextContent("Nested");
  });

  test("updates DOM with new props", () => {
    let element = Oregion.createElement("div", { id: "test", className: "old" });
    OregionDOM.render(element, container);

    let iterations = 0;
    const maxIterations = 100;
    while (globalState.nextUnitOfWork && iterations < maxIterations) {
      workLoop({ timeRemaining: () => 50 });
      jest.advanceTimersByTime(1);
      iterations++;
    }

    if (!globalState.nextUnitOfWork && globalState.wipRoot) {
      const commitRoot = require("oregion-dom").commitRoot;
      commitRoot();
    }

    expect(container.querySelector("#test")).toHaveClass("old");

    element = Oregion.createElement("div", { id: "test", className: "new" });
    OregionDOM.render(element, container);

    iterations = 0;
    while (globalState.nextUnitOfWork && iterations < maxIterations) {
      workLoop({ timeRemaining: () => 50 });
      jest.advanceTimersByTime(1);
      iterations++;
    }

    if (!globalState.nextUnitOfWork && globalState.wipRoot) {
      const commitRoot = require("oregion-dom").commitRoot;
      commitRoot();
    }

    expect(container.querySelector("#test")).toHaveClass("new");
  });
});
