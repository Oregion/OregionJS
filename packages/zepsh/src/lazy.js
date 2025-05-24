/**
 * @module zepsh/lazy
 * Lazy loading utilities for Zepsh.
 */
import { globalState } from "./state";

/**
 * Creates a lazy-loaded component.
 * @param {Function} factory - The factory function that returns a Promise resolving to a component.
 * @returns {Object} The lazy component.
 */
export function lazy(factory) {
  let Component = null;
  let error = null;
  let promise = null;

  return function LazyComponent(props) {
    if (error) throw error;
    if (Component) return createElement(Component, props);
    if (!promise) {
      promise = factory().then(
        (module) => {
          Component = module.default || module;
          globalState.wipRoot = {
            dom: globalState.currentRoot.dom,
            props: globalState.currentRoot.props,
            alternate: globalState.currentRoot,
          };
          globalState.nextUnitOfWork = globalState.wipRoot;
          globalState.deletions = [];
        },
        (err) => {
          error = err;
          globalState.wipRoot = {
            dom: globalState.currentRoot.dom,
            props: globalState.currentRoot.props,
            alternate: globalState.currentRoot,
          };
          globalState.nextUnitOfWork = globalState.wipRoot;
          globalState.deletions = [];
        }
      );
    }
    throw promise;
  };
}

/**
 * Helper to create a virtual DOM element (avoid circular import).
 * @param {string|Function} type - The element type.
 * @param {Object} props - The element properties.
 * @returns {Object} The virtual DOM element.
 */
function createElement(type, props) {
  return {
    type,
    props: { ...props, children: props.children || [] },
  };
}
