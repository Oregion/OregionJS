function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: { nodeValue: text, children: [] },
  };
}

export function createElement(type, props, ...children) {
  return {
    type,
    props: { ...props, children: children.map((child) => (typeof child === "object" ? child : createTextElement(child))) },
  };
}

export function useState(initial) {
  const oldHook = wipFiber.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks[hookIndex];
  const hook = { state: oldHook ? oldHook.state : initial, queue: [] };
  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action) => {
    hook.state = action(hook.state);
  });

  const setState = (action) => {
    hook.queue.push(action);

    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    };

    nextUnitOfWork = wipRoot;
    deletions = [];
  };

  wipFiber.hooks.push(hook);
  hookIndex++;

  return [hook.state, setState];
}

export function useEffect(callback, deps) {
  const oldHook = wipFiber.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks[hookIndex];
  const hasChanged = !oldHook || !deps || deps.some((dep, i) => !Object.is(dep, oldHook.deps[i]));
  const hook = { deps, effect: hasChanged ? callback : null };

  wipFiber.hooks.push(hook);
  hookIndex++;
}

export let wipFiber = null;
export let hookIndex = null;
export let currentRoot = null;
export let wipRoot = null;
export let nextUnitOfWork = null;
export let deletions = null;

export function resetHookState(fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
}

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  window.__OREGION_DEVTOOLS__ = {
    getRoot: () => currentRoot,
    getWip: () => wipRoot,
    getHooks: () => wipFiber?.hooks || [],
  };
}

const Oregion = {
  createElement,
  useState,
  useEffect,
  Fragment: "FRAGMENT",
};

export default Oregion;
