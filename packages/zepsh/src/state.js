/**
 * @module zepsh/state
 * Internal state management for Zepsh.
 */

/** @type {Object} Global state for the Zepsh framework. */
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
