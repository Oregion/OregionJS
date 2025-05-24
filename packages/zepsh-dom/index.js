/**
 * @module zepsh-dom
 * Public API for ZepshDOM.
 */
import { createFiber } from "./src/fiber";
import { globalState } from "../zepsh/src/state";

/**
 * Renders an element to the DOM.
 * @param {Object} element - The virtual DOM element.
 * @param {Node} container - The DOM container.
 */
export function render(element, container) {
  globalState.wipRoot = createFiber({
    dom: container,
    props: { children: [element] },
    alternate: globalState.currentRoot,
  });
  globalState.deletions = [];
  globalState.nextUnitOfWork = globalState.wipRoot;
}

export default {
  render,
};
