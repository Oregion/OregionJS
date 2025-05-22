function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

export function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) => (typeof child === "object" ? child : createTextElement(child))),
    },
  };
}

export function useState(initial) {
  const oldHook = globalState.wipFiber.alternate?.hooks?.[globalState.hookIndex];
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  };

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

  globalState.wipFiber.hooks.push(hook);
  globalState.hookIndex++;

  return [hook.state, setState];
}

export function useEffect(callback, deps) {
  const oldHook = globalState.wipFiber.alternate?.hooks?.[globalState.hookIndex];
  const hasChanged = !oldHook || !oldHook.deps || !deps || deps.some((dep, i) => !Object.is(dep, oldHook.deps[i]));

  const hook = {
    deps,
    effect: hasChanged ? callback : null,
    cleanup: oldHook?.cleanup,
  };

  globalState.wipFiber.hooks.push(hook);
  globalState.hookIndex++;
}

export function useRef(initial) {
  const oldHook = globalState.wipFiber.alternate?.hooks?.[globalState.hookIndex];
  const hook = { current: oldHook ? oldHook.current : initial };

  globalState.wipFiber.hooks.push(hook);
  globalState.hookIndex++;

  return hook;
}

export function useMemo(factory, deps) {
  const oldHook = globalState.wipFiber.alternate?.hooks?.[globalState.hookIndex];
  const hasChanged = !oldHook || !oldHook.deps || !deps || deps.some((dep, i) => !Object.is(dep, oldHook.deps[i]));
  const hook = {
    deps,
    value: hasChanged ? factory() : oldHook.value,
  };

  globalState.wipFiber.hooks.push(hook);
  globalState.hookIndex++;

  return hook.value;
}

export function useCallback(callback, deps) {
  return useMemo(() => callback, deps);
}

export let globalState = {
  wipFiber: null,
  hookIndex: null,
  currentRoot: null,
  wipRoot: null,
  nextUnitOfWork: null,
  deletions: null,
};

export function resetHookState(fiber) {
  globalState.wipFiber = fiber;
  globalState.hookIndex = 0;
  globalState.wipFiber.hooks = [];
}

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  window.__OREGION_DEVTOOLS__ = {
    getRoot: () => globalState.currentRoot,
    getWip: () => globalState.wipRoot,
    getHooks: () => globalState.wipFiber?.hooks || [],
  };
}

const Oregion = {
  createElement,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  Fragment: "FRAGMENT",
};

export default Oregion;
