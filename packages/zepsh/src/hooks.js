/**
 * @module zepsh/hooks
 * Hook implementations for Zepsh.
 */
import { globalState } from "./state";
import { scheduleTask } from "./scheduler";

/**
 * Creates a hook object with consistent structure.
 * @param {Object} options - Hook options (state, deps, etc.).
 * @returns {Object} The hook object.
 */
function createHook({ state, deps, value, effect, cleanup, dispatch, id, context, pending, optimistic, error, resource, ref }) {
  const hook = { state, deps, value, effect, cleanup, dispatch, id, context, pending, optimistic, error, resource, ref };
  globalState.wipFiber.hooks.push(hook);
  globalState.hookIndex++;
  return hook;
}

/**
 * Manages state for a component.
 * @param {any} initial - The initial state.
 * @returns {[any, Function]} The state and setter function.
 */
export function useState(initial) {
  const oldHook = globalState.wipFiber.alternate?.hooks?.[globalState.hookIndex];
  const hook = createHook({
    state: oldHook ? oldHook.state : initial,
    queue: [],
  });

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action) => {
    hook.state = typeof action === "function" ? action(hook.state) : action;
  });

  const setState = (action) => {
    hook.queue.push(action);
    globalState.wipRoot = {
      dom: globalState.currentRoot.dom,
      props: globalState.currentRoot.props,
      alternate: globalState.currentRoot,
    };
    globalState.nextUnitOfWork = globalState.wipRoot;
    globalState.deletions = [];
  };

  return [hook.state, setState];
}

/**
 * Runs a side effect after rendering.
 * @param {Function} callback - The effect callback.
 * @param {Array} deps - Dependency array.
 */
export function useEffect(callback, deps) {
  const oldHook = globalState.wipFiber.alternate?.hooks?.[globalState.hookIndex];
  const hasChanged = !oldHook || !oldHook.deps || !deps || deps.some((dep, i) => !Object.is(dep, oldHook.deps[i]));
  createHook({
    deps,
    effect: hasChanged ? callback : null,
    cleanup: oldHook?.cleanup,
  });
}

/**
 * Runs a side effect synchronously before browser paint.
 * @param {Function} callback - The effect callback.
 * @param {Array} deps - Dependency array.
 */
export function useLayoutEffect(callback, deps) {
  const oldHook = globalState.wipFiber.alternate?.hooks?.[globalState.hookIndex];
  const hasChanged = !oldHook || !oldHook.deps || !deps || deps.some((dep, i) => !Object.is(dep, oldHook.deps[i]));
  createHook({
    deps,
    effect: hasChanged ? callback : null,
    cleanup: oldHook?.cleanup,
    isLayout: true,
  });
}

/**
 * Runs a side effect synchronously before DOM mutations (for CSS-in-JS).
 * @param {Function} callback - The effect callback.
 * @param {Array} deps - Dependency array.
 */
export function useInsertionEffect(callback, deps) {
  const oldHook = globalState.wipFiber.alternate?.hooks?.[globalState.hookIndex];
  const hasChanged = !oldHook || !oldHook.deps || !deps || deps.some((dep, i) => !Object.is(dep, oldHook.deps[i]));
  createHook({
    deps,
    effect: hasChanged ? callback : null,
    cleanup: oldHook?.cleanup,
    isInsertion: true,
  });
}

/**
 * Creates a mutable reference object.
 * @param {any} initial - The initial value.
 * @returns {Object} The reference object.
 */
export function useRef(initial) {
  const oldHook = globalState.wipFiber.alternate?.hooks?.[globalState.hookIndex];
  return createHook({ ref: oldHook ? oldHook.ref : { current: initial } }).ref;
}

/**
 * Creates a mutable reference with cleanup logic.
 * @param {any} initial - The initial value.
 * @param {Function} cleanupFn - Function to run on unmount or ref change.
 * @returns {Object} The reference object.
 */
export function useRefCleanup(initial, cleanupFn) {
  const oldHook = globalState.wipFiber.alternate?.hooks?.[globalState.hookIndex];
  const ref = createHook({
    ref: oldHook ? oldHook.ref : { current: initial },
    cleanup: oldHook?.cleanup,
  }).ref;

  useEffect(() => {
    return () => {
      if (ref.current !== null) {
        cleanupFn(ref.current);
        ref.current = null;
      }
    };
  }, [ref, cleanupFn]);

  return ref;
}

/**
 * Customizes the ref exposed to parent components.
 * @param {Object} ref - The forwarded ref.
 * @param {Function} createHandle - Function to create the exposed handle.
 * @param {Array} deps - Dependency array.
 */
export function useImperativeHandle(ref, createHandle, deps) {
  const oldHook = globalState.wipFiber.alternate?.hooks?.[globalState.hookIndex];
  const hasChanged = !oldHook || !oldHook.deps || !deps || deps.some((dep, i) => !Object.is(dep, oldHook.deps[i]));
  const hook = createHook({
    deps,
    value: hasChanged ? createHandle() : oldHook.value,
  });
  if (hasChanged && ref) {
    ref.current = hook.value;
  }
}

/**
 * Memoizes a value based on dependencies.
 * @param {Function} factory - The factory function to compute the value.
 * @param {Array} deps - Dependency array.
 * @returns {any} The memoized value.
 */
export function useMemo(factory, deps) {
  const oldHook = globalState.wipFiber.alternate?.hooks?.[globalState.hookIndex];
  const hasChanged = !oldHook || !oldHook.deps || !deps || deps.some((dep, i) => !Object.is(dep, oldHook.deps[i]));
  return createHook({
    deps,
    value: hasChanged ? factory() : oldHook.value,
  }).value;
}

/**
 * Memoizes a callback function.
 * @param {Function} callback - The callback to memoize.
 * @param {Array} deps - Dependency array.
 * @returns {Function} The memoized callback.
 */
export function useCallback(callback, deps) {
  return useMemo(() => callback, deps);
}

/**
 * Manages complex state logic with a reducer.
 * @param {Function} reducer - The reducer function.
 * @param {any} initialState - The initial state.
 * @param {Function} [init] - Optional initializer function.
 * @returns {[any, Function]} The state and dispatch function.
 */
export function useReducer(reducer, initialState, init) {
  const oldHook = globalState.wipFiber.alternate?.hooks?.[globalState.hookIndex];
  const hook = createHook({
    state: oldHook ? oldHook.state : init ? init(initialState) : initialState,
    dispatch: oldHook
      ? oldHook.dispatch
      : (action) => {
          hook.state = reducer(hook.state, action);
          globalState.wipRoot = {
            dom: globalState.currentRoot.dom,
            props: globalState.currentRoot.props,
            alternate: globalState.currentRoot,
          };
          globalState.nextUnitOfWork = globalState.wipRoot;
          globalState.deletions = [];
        },
  });
  return [hook.state, hook.dispatch];
}

/**
 * Reads a context value.
 * @param {Object} context - The context object created by createContext.
 * @returns {any} The current context value.
 */
export function useContext(context) {
  const oldHook = globalState.wipFiber.alternate?.hooks?.[globalState.hookIndex];
  const hook = createHook({
    context,
    value: oldHook ? oldHook.value : context._currentValue,
  });

  if (!oldHook) {
    context._subscribers.add(hook);
    hook.cleanup = () => context._subscribers.delete(hook);
  }

  return hook.value;
}

/**
 * Defers a value to prioritize urgent updates.
 * @param {any} value - The value to defer.
 * @returns {any} The deferred value.
 */
export function useDeferredValue(value) {
  const oldHook = globalState.wipFiber.alternate?.hooks?.[globalState.hookIndex];
  const hook = createHook({
    value: oldHook ? oldHook.value : value,
    pending: false,
  });

  if (!Object.is(value, hook.value)) {
    hook.pending = true;
    setTimeout(() => {
      hook.value = value;
      hook.pending = false;
      globalState.wipRoot = {
        dom: globalState.currentRoot.dom,
        props: globalState.currentRoot.props,
        alternate: globalState.currentRoot,
      };
      globalState.nextUnitOfWork = globalState.wipRoot;
      globalState.deletions = [];
    }, 0);
  }

  return hook.pending ? oldHook?.value ?? value : value;
}

/**
 * Marks a state update as a transition.
 * @returns {[boolean, Function]} The pending state and startTransition function.
 */
export function useTransition() {
  const hook = createHook({
    pending: false,
  });

  const startTransition = (callback) => {
    hook.pending = true;
    callback();
    setTimeout(() => {
      hook.pending = false;
      globalState.wipRoot = {
        dom: globalState.currentRoot.dom,
        props: globalState.currentRoot.props,
        alternate: globalState.currentRoot,
      };
      globalState.nextUnitOfWork = globalState.wipRoot;
      globalState.deletions = [];
    }, 0);
  };

  return [hook.pending, startTransition];
}

/**
 * Manages state updates for form actions.
 * @param {Function} action - The async action function.
 * @param {any} initialState - The initial state.
 * @returns {[any, Function, boolean]} The state, action dispatcher, and pending state.
 */
export function useActionState(action, initialState) {
  const [state, dispatch] = useReducer((prevState, actionResult) => actionResult, initialState);
  const hook = createHook({
    pending: false,
  });

  const dispatchAction = async (...args) => {
    hook.pending = true;
    try {
      const result = await action(state, ...args);
      dispatch(result);
    } catch (error) {
      dispatch({ error });
    } finally {
      hook.pending = false;
    }
  };

  return [state, dispatchAction, hook.pending];
}

/**
 * Provides optimistic state updates.
 * @param {any} state - The current state.
 * @param {Function} updateFn - The function to update the state optimistically.
 * @returns {[any, Function]} The optimistic state and update function.
 */
export function useOptimistic(state, updateFn) {
  const oldHook = globalState.wipFiber.alternate?.hooks?.[globalState.hookIndex];
  const hook = createHook({
    optimistic: oldHook ? oldHook.optimistic : state,
  });

  const updateOptimistic = async (value) => {
    hook.optimistic = updateFn(hook.optimistic, value);
    globalState.wipRoot = {
      dom: globalState.currentRoot.dom,
      props: globalState.currentRoot.props,
      alternate: globalState.currentRoot,
    };
    globalState.nextUnitOfWork = globalState.wipRoot;
    globalState.deletions = [];
  };

  return [hook.optimistic, updateOptimistic];
}

/**
 * Subscribes to an external store.
 * @param {Function} subscribe - The subscription function.
 * @param {Function} getSnapshot - The function to get the current state.
 * @returns {any} The current store state.
 */
export function useSyncExternalStore(subscribe, getSnapshot) {
  const oldHook = globalState.wipFiber.alternate?.hooks?.[globalState.hookIndex];
  const hook = createHook({
    value: oldHook ? oldHook.value : getSnapshot(),
  });

  if (!oldHook) {
    const listener = () => {
      const newValue = getSnapshot();
      if (!Object.is(newValue, hook.value)) {
        hook.value = newValue;
        globalState.wipRoot = {
          dom: globalState.currentRoot.dom,
          props: globalState.currentRoot.props,
          alternate: globalState.currentRoot,
        };
        globalState.nextUnitOfWork = globalState.wipRoot;
        globalState.deletions = [];
      }
    };
    hook.cleanup = subscribe(listener);
  }

  return hook.value;
}

/**
 * Generates a unique ID for accessibility or SSR.
 * @returns {string} A unique ID.
 */
export function useId() {
  const oldHook = globalState.wipFiber.alternate?.hooks?.[globalState.hookIndex];
  if (oldHook) return oldHook.id;

  const fiberId = globalState.wipFiber._debugName + "-" + globalState.hookIndex;
  const id = typeof window === "undefined" ? `:${fiberId}:` : `#${fiberId}-${Date.now()}`;
  createHook({ id });
  return id;
}

/**
 * Adds a debug label for custom hooks in DevTools.
 * @param {any} value - The value to display.
 * @param {Function} [format] - Optional formatter function.
 */
export function useDebugValue(value, format) {
  if (process.env.NODE_ENV !== "production") {
    const formatted = format ? format(value) : value;
    createHook({ value: formatted });
  }
}

/**
 * Handles errors within a component.
 * @param {Function} errorHandler - Function to handle the error.
 * @returns {Function} Function to throw errors to the nearest ErrorBoundary.
 */
export function useErrorBoundary(errorHandler) {
  const hook = createHook({
    error: null,
  });

  const handleError = (error) => {
    hook.error = error;
    errorHandler(error);
    globalState.wipRoot = {
      dom: globalState.currentRoot.dom,
      props: globalState.currentRoot.props,
      alternate: globalState.currentRoot,
    };
    globalState.nextUnitOfWork = globalState.wipRoot;
    globalState.deletions = [];
  };

  return handleError;
}

/**
 * Reads a resource (context, promise, or value) in suspense.
 * @param {any} resource - The resource to read.
 * @returns {any} The resource value.
 */
export function use(resource) {
  if (resource instanceof Promise) {
    throw resource; // Trigger suspense
  }
  if (resource && resource._currentValue !== undefined) {
    return useContext(resource); // Handle context
  }
  return resource; // Direct value
}

/**
 * Marks a state update as a transition.
 * @param {Function} callback - The callback to run in a transition.
 */
export function startTransition(callback) {
  scheduleTask(() => {
    callback();
    globalState.wipRoot = {
      dom: globalState.currentRoot.dom,
      props: globalState.currentRoot.props,
      alternate: globalState.currentRoot,
    };
    globalState.nextUnitOfWork = globalState.wipRoot;
    globalState.deletions = [];
  }, 1); // Normal priority
}

/**
 * Persists state in localStorage.
 * @param {string} key - The storage key.
 * @param {any} initialValue - The initial value.
 * @returns {[any, Function]} The state and setter function.
 */
export function useLocalStorage(key, initialValue) {
  const [state, setState] = useState(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error saving to localStorage: ${error}`);
    }
  }, [state]);

  return [state, setState];
}

/**
 * Debounces a value to prevent frequent updates.
 * @param {any} value - The value to debounce.
 * @param {number} delay - The debounce delay in milliseconds.
 * @returns {any} The debounced value.
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Fetches data with suspense support.
 * @param {string} url - The URL to fetch.
 * @param {Object} [options] - Fetch options.
 * @returns {any} The fetched data.
 */
export function useFetch(url, options = {}) {
  const cache = useMemo(() => new Map(), []);
  const cacheKey = JSON.stringify({ url, options });

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const promise = fetch(url, options)
    .then((res) => {
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      return res.json();
    })
    .then((data) => {
      cache.set(cacheKey, data);
      return data;
    });

  promise.catch((error) => {
    cache.set(cacheKey, { error });
  });

  throw promise; // Trigger suspense
}

/**
 * Caches a resource for suspense.
 * @param {Function} resourceFn - The function to compute the resource.
 * @returns {any} The cached resource.
 */
export function cache(resourceFn) {
  const cacheMap = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cacheMap.has(key)) {
      return cacheMap.get(key);
    }
    const promise = resourceFn(...args).then((result) => {
      cacheMap.set(key, result);
      return result;
    });
    cacheMap.set(key, promise);
    throw promise;
  };
}
