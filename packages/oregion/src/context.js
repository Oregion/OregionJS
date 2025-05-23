/**
 * @module oregion/context
 * Context creation for Oregion.
 */

/**
 * Creates a context object.
 * @param {any} defaultValue - The default context value.
 * @returns {Object} The context object.
 */
export function createContext(defaultValue) {
  const context = {
    _currentValue: defaultValue,
    _subscribers: new Set(),
    Provider: ({ value, children }) => {
      if (!Object.is(value, context._currentValue)) {
        context._currentValue = value;
        context._subscribers.forEach((hook) => {
          hook.value = value;
          globalState.wipRoot = {
            dom: globalState.currentRoot.dom,
            props: globalState.currentRoot.props,
            alternate: globalState.currentRoot,
          };
          globalState.nextUnitOfWork = globalState.wipRoot;
          globalState.deletions = [];
        });
      }
      return children;
    },
  };
  return context;
}
