/**
 * @module oregion/testing
 * Testing utilities for Oregion.
 */
import { globalState } from "./state";
import { commitRoot, workLoop } from "../../oregion-dom/src/work";

/**
 * Simulates a rendering cycle for testing, flushing all effects and updates.
 * @param {Function} callback - The test callback to run.
 * @returns {Promise<void>} Resolves when all updates are complete.
 */
export async function act(callback) {
  await callback();
  while (globalState.nextUnitOfWork || globalState.wipRoot) {
    const deadline = { timeRemaining: () => 50 };
    workLoop(deadline);
    if (globalState.wipRoot && !globalState.nextUnitOfWork) {
      commitRoot();
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}
