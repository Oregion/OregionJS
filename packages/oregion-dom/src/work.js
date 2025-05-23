/**
 * @module oregion-dom/work
 * Work loop and commit logic for OregionDOM.
 */
import { globalState, resetHookState } from "../../oregion/src/state";
import { createDom, updateDom } from "./dom";
import { reconcileChildren } from "./fiber";

/**
 * Commits the work-in-progress tree to the DOM.
 */
export function commitRoot() {
  globalState.deletions.forEach(commitWork);
  runEffects(globalState.wipRoot.child, "insertion");
  runEffects(globalState.wipRoot.child, "layout");
  commitWork(globalState.wipRoot.child);
  runEffects(globalState.wipRoot.child, "effect");
  globalState.currentRoot = globalState.wipRoot;
  globalState.wipRoot = null;
}

/**
 * Commits a fiber to the DOM.
 * @param {Object} fiber - The fiber to commit.
 */
function commitWork(fiber) {
  if (!fiber) return;

  let domParentFiber = fiber.parent;
  while (domParentFiber && !domParentFiber.dom) domParentFiber = domParentFiber.parent;
  const domParent = domParentFiber?.dom;

  if (fiber.effectTag === "UPDATE" && fiber.alternate) {
    const oldHooks = fiber.alternate.hooks || [];
    oldHooks.forEach((hook, i) => {
      const newHook = fiber.hooks?.[i];
      if (hook.cleanup && (!newHook || newHook.effect)) hook.cleanup();
    });
  }

  if (fiber.effectTag === "PLACEMENT" && fiber.dom) domParent.appendChild(fiber.dom);
  else if (fiber.effectTag === "UPDATE" && fiber.dom) updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  else if (fiber.effectTag === "DELETION") commitDeletion(fiber, domParent);

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

/**
 * Runs effects for a fiber tree based on type (insertion, layout, or effect).
 * @param {Object} fiber - The fiber to process.
 * @param {string} effectType - The type of effect to run (insertion, layout, effect).
 */
function runEffects(fiber, effectType) {
  if (!fiber) return;

  if (fiber.hooks) {
    fiber.hooks.forEach((hook) => {
      if (typeof hook.cleanup === "function") {
        hook.cleanup();
        hook.cleanup = null;
      }
      if (typeof hook.effect === "function" && ((effectType === "insertion" && hook.isInsertion) || (effectType === "layout" && hook.isLayout) || (effectType === "effect" && !hook.isInsertion && !hook.isLayout))) {
        const cleanup = hook.effect();
        if (typeof cleanup === "function") hook.cleanup = cleanup;
      }
    });
  }

  runEffects(fiber.child, effectType);
  runEffects(fiber.sibling, effectType);
}

/**
 * Removes a fiber from the DOM.
 * @param {Object} fiber - The fiber to delete.
 * @param {Node} domParent - The parent DOM node.
 */
function commitDeletion(fiber, domParent) {
  if (fiber.hooks) {
    fiber.hooks.forEach((hook) => {
      if (hook.cleanup) hook.cleanup();
    });
  }

  if (fiber.dom) domParent.removeChild(fiber.dom);
  else commitDeletion(fiber.child, domParent);
}

/**
 * The work loop for processing fibers.
 * @param {Object} deadline - The requestIdleCallback deadline.
 */
export function workLoop(deadline) {
  let shouldYield = false;
  while (globalState.nextUnitOfWork && !shouldYield) {
    globalState.nextUnitOfWork = performUnitOfWork(globalState.nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!globalState.nextUnitOfWork && globalState.wipRoot) commitRoot();

  requestIdleCallback(workLoop);
}

const requestIdleCallback = window.requestIdleCallback || ((cb) => setTimeout(() => cb({ timeRemaining: () => 50 }), 1));

requestIdleCallback(workLoop);

/**
 * Processes a unit of work in the fiber tree.
 * @param {Object} fiber - The current fiber.
 * @returns {Object|null} The next fiber to process.
 */
function performUnitOfWork(fiber) {
  const isFunctionComponent = typeof fiber.type === "function";
  if (isFunctionComponent) updateFunctionComponent(fiber);
  else updateHostComponent(fiber);

  if (fiber.child) return fiber.child;
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) return nextFiber.sibling;
    nextFiber = nextFiber.parent;
  }
  return null;
}

/**
 * Gets the component stack for error reporting.
 * @param {Object} fiber - The current fiber.
 * @returns {string} The component stack.
 */
function getComponentStack(fiber) {
  const stack = [];
  let current = fiber;
  while (current) {
    if (typeof current.type === "function") stack.push(current.type.name || "Anonymous");
    current = current.parent;
  }
  return stack.reverse().join(" > ");
}

/**
 * Finds an error boundary in the fiber tree.
 * @param {Object} fiber - The current fiber.
 * @param {Error} error - The error to handle.
 * @returns {Object|null} The error boundary fiber or null.
 */
function findErrorBoundary(fiber, error) {
  let current = fiber.parent;
  while (current) {
    const Component = current.type;
    if (typeof Component === "function" && Component.getDerivedError) {
      if (typeof Component.onErrorCaught === "function") {
        Component.onErrorCaught(error, {
          componentStack: getComponentStack(current),
          componentName: Component.name || "Anonymous",
        });
      }
      return current;
    }
    current = current.parent;
  }
  return null;
}

/**
 * Updates a function component.
 * @param {Object} fiber - The fiber to update.
 */
function updateFunctionComponent(fiber) {
  resetHookState(fiber);
  let child;
  try {
    const isBoundary = fiber.type.getDerivedError && fiber.error;
    const props = isBoundary ? { ...fiber.props, error: fiber.error } : fiber.props;
    child = fiber.type(props);
  } catch (error) {
    const boundary = findErrorBoundary(fiber, error);
    if (boundary) {
      boundary.error = error;
      globalState.wipRoot = { ...globalState.currentRoot, alternate: globalState.currentRoot };
      globalState.nextUnitOfWork = globalState.wipRoot;
      globalState.deletions = [];
      return;
    }
    throw error;
  }
  reconcileChildren(fiber, [child]);
}

/**
 * Updates a host component.
 * @param {Object} fiber - The fiber to update.
 */
function updateHostComponent(fiber) {
  if (!fiber.dom) fiber.dom = createDom(fiber);
  reconcileChildren(fiber, fiber.props.children);
}
