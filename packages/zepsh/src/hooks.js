/**
 * @module zepsh/hooks
 * Hook implementations for Zepsh.
 */
import { globalState } from "./state";
import { scheduleTask } from "./scheduler";
import { createContext } from "./context";
import { cache } from "./cache";

/**
 * Creates a hook object with consistent structure.
 * @param {Object} options - Hook options (state, deps, etc.).
 * @returns {Object} The hook object.
 */
function createHook({ state, deps, value, effect, cleanup, dispatch, id, context, pending, optimistic, error, resource, ref, cache }) {
  const hook = { state, deps, value, effect, cleanup, dispatch, id, context, pending, optimistic, error, resource, ref, cache };
  globalState.wipFiber.hooks.push(hook);
  globalState.hookIndex++;
  return hook;
}

/**
 * Context for tracking form status.
 */
const FormStatusContext = createContext(null);

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
  if (hasChanged && ref) ref.current = hook.value;
}

/**
 * Memoizes a value based on dependencies with optional caching.
 * @param {Function} factory - The factory function to compute the value.
 * @param {Array} deps - Dependency array.
 * @param {number} [cacheSize=1] - Number of cached values to store.
 * @returns {any} The memoized value.
 */
export function useMemo(factory, deps, cacheSize = 1) {
  const oldHook = globalState.wipFiber.alternate?.hooks?.[globalState.hookIndex];
  const hasChanged = !oldHook || !oldHook.deps || !deps || deps.some((dep, i) => !Object.is(dep, oldHook.deps[i]));
  const hook = createHook({
    deps,
    value: hasChanged ? factory() : oldHook.value,
    cache: oldHook ? oldHook.cache : cacheSize > 0 ? [] : [],
  });
  if (hasChanged && cacheSize > 0) {
    hook.cache.push(hook.value);
    if (hook.cache.length > cacheSize) hook.cache.shift();
  }
  return hook.value;
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
    FormStatusContext._currentValue = { pending: true, data: args };
    try {
      const result = await action(state, ...args);
      dispatch(result);
    } catch (error) {
      dispatch({ error });
    } finally {
      hook.pending = false;
      FormStatusContext._currentValue = { pending: false, data: null };
    }
  };

  return [state, dispatchAction, hook.pending];
}

/**
 * Provides form submission status.
 * @returns {Object} The form status (pending, data).
 * @throws {Error} If used outside a form context.
 */
export function useFormStatus() {
  const status = useContext(FormStatusContext);
  if (!status) throw new Error("useFormStatus must be used within a form context");
  return status;
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
  if (resource instanceof Promise) throw resource;
  if (resource && resource._currentValue !== undefined) return useContext(resource);
  return resource;
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
  }, 1);
}

/**
 * Caches a resource for suspense.
 * @param {Function} resourceFn - The function to compute the resource.
 * @returns {any} The cached resource.
 */
export function createCache(resourceFn) {
  const cacheMap = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cacheMap.has(key)) return cacheMap.get(key);
    const promise = resourceFn(...args).then((result) => {
      cacheMap.set(key, result);
      return result;
    });
    cacheMap.set(key, promise);
    throw promise;
  };
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
      console.error("Failed to save to localStorage:", error);
    }
  }, [key, state]);

  return [state, setState];
}

/**
 * Debounces a value.
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
 * Fetches data with suspense and caching support.
 * @param {string} url - The URL to fetch.
 * @param {Object} [options] - Fetch options.
 * @param {string} [options.cacheKey] - Cache key for deduplication.
 * @returns {any} The fetched data.
 */
export function useFetch(url, options = {}) {
  const cacheKey = options.cacheKey || url;
  const cached = cache.get(cacheKey);

  if (cached) return cached;

  const promise = fetch(url, options)
    .then((res) => {
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      return res.json();
    })
    .then((data) => {
      cache.set(cacheKey, data);
      return data;
    });

  cache.set(cacheKey, promise);
  throw promise;
}

/**
 * Tracks window size.
 * @returns {{ width: number, height: number }} The window dimensions.
 */
export function useWindowSize() {
  const [size, setSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
}

/**
 * Runs a callback at a specified interval.
 * @param {Function} callback - The callback to run.
 * @param {number} delay - The interval delay in milliseconds.
 */
export function useInterval(callback, delay) {
  const savedCallback = useRefCleanup(null, () => clearInterval(savedCallback.current));

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null && delay >= 0) {
      const id = setInterval(() => savedCallback.current(), delay);
      savedCallback.current = id;
      return () => clearInterval(id);
    }
  }, [delay]);
}

/**
 * Manages form state and validation.
 * @param {Object} initialValues - Initial form values.
 * @param {Object} [options] - Form options.
 * @param {Function} [options.validate] - Validation function.
 * @returns {Object} Form state, handlers, and utilities.
 */
export function useForm(initialValues, options = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
    if (options.validate) {
      const newErrors = options.validate({ ...values, [name]: value });
      setErrors(newErrors);
    }
  };

  const handleSubmit = (callback) => async (e) => {
    e.preventDefault();
    if (options.validate) {
      const newErrors = options.validate(values);
      setErrors(newErrors);
      if (Object.keys(newErrors).length) return;
    }
    await callback(values);
  };

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleSubmit,
    resetForm,
  };
}

/**
 * Tracks media query matches.
 * @param {string} query - The media query (e.g., "(min-width: 768px)").
 * @returns {boolean} Whether the media query matches.
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    media.addListener(listener);
    return () => media.removeListener(listener);
  }, [query]);

  return matches;
}

/**
 * Toggles a boolean state.
 * @param {boolean} initialValue - The initial toggle state.
 * @returns {[boolean, Function, Function, Function]} The state, toggle, setTrue, and setFalse functions.
 */
export function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);
  const toggle = () => setValue((prev) => !prev);
  const setTrue = () => setValue(true);
  const setFalse = () => setValue(false);
  return [value, toggle, setTrue, setFalse];
}

/**
 * Tracks the previous value of a state or prop.
 * @param {any} value - The value to track.
 * @returns {any} The previous value.
 */
export function usePrevious(value) {
  const ref = useRefCleanup(null, () => {});
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

/**
 * Manages localization and formatting.
 * @param {Object} translations - Translation strings (e.g., { en: { greet: "Hello" } }).
 * @param {string} [defaultLocale="en"] - The default locale.
 * @returns {Object} Translation function, locale, and setter.
 */
export function useLocale(translations, defaultLocale = "en") {
  const [locale, setLocale] = useState(defaultLocale);

  const t = (key, params = {}) => {
    const translation = translations[locale]?.[key] || key;
    if (typeof translation === "function") return translation(params);
    return Object.entries(params).reduce((str, [k, v]) => str.replace(`{${k}}`, v), translation);
  };

  return { t, locale, setLocale };
}
