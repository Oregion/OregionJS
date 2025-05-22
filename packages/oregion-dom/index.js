import { globalState, resetHookState } from "oregion";

function createDom(fiber) {
  if (fiber.type === "TEXT_ELEMENT") return document.createTextNode("");
  if (fiber.type === "FRAGMENT") return null;
  const dom = document.createElement(fiber.type);
  updateDom(dom, {}, fiber.props);
  return dom;
}

function createFiber({ type, props, dom = null, parent = null, alternate = null, effectTag = null }) {
  return {
    type,
    props,
    dom,
    parent,
    child: null,
    sibling: null,
    alternate,
    effectTag,
    _debugName: typeof type === "function" ? type.name : type,
  };
}

const isEvent = (key) => key.startsWith("on");
const isProperty = (key) => key !== "children" && !isEvent(key);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (prev, next) => (key) => !(key in next);

function updateDom(dom, prevProps, nextProps) {
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = "";
    });

  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = nextProps[name];
    });

  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}

function commitRoot() {
  globalState.deletions.forEach(commitWork);
  commitWork(globalState.wipRoot.child);
  runEffects(globalState.wipRoot.child);
  globalState.currentRoot = globalState.wipRoot;
  globalState.wipRoot = null;
}

function commitWork(fiber) {
  if (!fiber) return;

  let domParentFiber = fiber.parent;
  while (domParentFiber && !domParentFiber.dom) domParentFiber = domParentFiber.parent;
  const domParent = domParentFiber.dom;

  if (fiber.effectTag === "UPDATE" && fiber.alternate) {
    const oldHooks = fiber.alternate.hooks || [];
    oldHooks.forEach((hook, i) => {
      const newHook = fiber.hooks?.[i];
      if (hook.cleanup && (!newHook || newHook.effect)) hook.cleanup();
    });
  }

  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) domParent.appendChild(fiber.dom);
  else if (fiber.effectTag === "UPDATE" && fiber.dom != null) updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  else if (fiber.effectTag === "DELETION") commitDeletion(fiber, domParent);

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function runEffects(fiber) {
  if (!fiber) return;

  if (fiber.hooks) {
    for (const hook of fiber.hooks) {
      if (typeof hook.cleanup === "function") {
        hook.cleanup();
        hook.cleanup = null;
      }
      if (typeof hook.effect === "function") {
        const cleanup = hook.effect();
        if (typeof cleanup === "function") hook.cleanup = cleanup;
      }
    }
  }

  runEffects(fiber.child);
  runEffects(fiber.sibling);
}

function commitDeletion(fiber, domParent) {
  if (fiber.hooks) {
    fiber.hooks.forEach((hook) => {
      if (hook.cleanup) hook.cleanup();
    });
  }

  if (fiber.dom) domParent.removeChild(fiber.dom);
  else commitDeletion(fiber.child, domParent);
}

function render(element, container) {
  globalState.wipRoot = createFiber({
    dom: container,
    props: { children: [element] },
    alternate: globalState.currentRoot,
  });
  globalState.deletions = [];
  globalState.nextUnitOfWork = globalState.wipRoot;
}

const requestIdleCallback =
  window.requestIdleCallback ||
  function (cb) {
    return setTimeout(() => cb({ timeRemaining: () => 50 }), 1);
  };

function workLoop(deadline) {
  let shouldYield = false;
  while (globalState.nextUnitOfWork && !shouldYield) {
    globalState.nextUnitOfWork = performUnitOfWork(globalState.nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!globalState.nextUnitOfWork && globalState.wipRoot) commitRoot();

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function performUnitOfWork(fiber) {
  const isFunctionComponent = typeof fiber.type === "function";
  if (isFunctionComponent) updateFunctionComponent(fiber);
  else updateHostComponent(fiber);

  if (fiber.child) return fiber.child;
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) return nextFiber.sibling;
    nextFiber = nextFiber.parent;
  }
  return null;
}

function getComponentStack(fiber) {
  const stack = [];
  let current = fiber;
  while (current) {
    if (typeof current.type === "function") stack.push(current.type.name || "Anonymous");
    current = current.parent;
  }
  return stack.reverse().join(" > ");
}

function findErrorBoundary(fiber, error) {
  let current = fiber.parent;
  while (current) {
    const Component = current.type;
    if (typeof Component === "function" && Component.getDerivedError) {
      if (typeof Component.onErrorCaught === "function") {
        Component.onErrorCaught(error, {
          componentStack: getComponentStack(current),
          componentName: Component.name || "Anonymous",
        });
      }
      return current;
    }
    current = current.parent;
  }
  return null;
}

function updateFunctionComponent(fiber) {
  resetHookState(fiber);
  let child;
  try {
    const isBoundary = fiber.type.getDerivedError && fiber.error;
    const props = isBoundary ? { ...fiber.props, error: fiber.error } : fiber.props;
    child = fiber.type(props);
  } catch (error) {
    const boundary = findErrorBoundary(fiber, error);
    if (boundary) {
      boundary.error = error;
      globalState.wipRoot = { ...globalState.currentRoot, alternate: globalState.currentRoot };
      globalState.nextUnitOfWork = globalState.wipRoot;
      globalState.deletions = [];
      return;
    }
    throw error;
  }
  reconcileChildren(fiber, [child]);
}

function updateHostComponent(fiber) {
  if (!fiber.dom) fiber.dom = createDom(fiber);
  reconcileChildren(fiber, fiber.props.children);
}

function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate?.child;
  let prevSibling = null;
  const oldFibersByKey = new Map();

  while (oldFiber) {
    const key = oldFiber.props.key || index;
    oldFibersByKey.set(key, oldFiber);
    oldFiber = oldFiber.sibling;
    index++;
  }

  index = 0;
  for (const element of elements) {
    const key = element.props.key || index;
    if (!element.props.key && process.env.NODE_ENV !== "production") console.warn("Warning: Each child in a list should have a unique 'key' prop.", element);

    const matchedOldFiber = oldFibersByKey.get(key);
    const sameType = matchedOldFiber && element?.type === matchedOldFiber.type;

    const newFiber = sameType
      ? createFiber({
          type: matchedOldFiber.type,
          props: element.props,
          dom: matchedOldFiber.dom,
          parent: wipFiber,
          alternate: matchedOldFiber,
          effectTag: "UPDATE",
        })
      : createFiber({
          type: element.type,
          props: element.props,
          parent: wipFiber,
          effectTag: "PLACEMENT",
        });

    if (sameType) {
      oldFibersByKey.delete(key);
    } else if (matchedOldFiber) {
      matchedOldFiber.effectTag = "DELETION";
      globalState.deletions.push(matchedOldFiber);
    }

    if (index === 0) wipFiber.child = newFiber;
    else if (prevSibling) prevSibling.sibling = newFiber;

    prevSibling = newFiber;
    index++;
  }

  oldFibersByKey.forEach((oldFiber) => {
    oldFiber.effectTag = "DELETION";
    globalState.deletions.push(oldFiber);
  });
}

const OregionDOM = {
  render,
};

export default OregionDOM;
