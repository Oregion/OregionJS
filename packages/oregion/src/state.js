/**
 * @module oregion/state
 * Internal state management for Oregion.
 */

/** @type {Object} Global state for the Oregion framework. */
const globalState = {
  wipFiber: null,
  hookIndex: 0,
  currentRoot: null,
  wipRoot: null,
  nextUnitOfWork: null,
  deletions: [],
};

/**
 * Resets the hook for a fiber.
 * @param {Object} fiber - The current fiber.
 */
export function resetHookState(fiber) {
  globalState.wipFiber = fiber;
  globalState.hookIndex = 0;
  globalState.wipFiber.hooks = [];
}

export { globalState };
