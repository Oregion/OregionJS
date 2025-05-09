import { currentRoot, wipRoot, nextUnitOfWork, deletions, resetHookState } from "oregion";

function createDom(fiber) {
  const dom = fiber.type === "TEXT_ELEMENT" ? document.createTextNode("") : fiber.type === "FRAGMENT" ? null : document.createElement(fiber.type);
  if (dom) updateDom(dom, {}, fiber.props);

  return dom;
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
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot.current = wipRoot;
  wipRoot.current = null;
}

function commitWork(fiber) {
  if (!fiber) return;
  let domParentFiber = fiber.parent;

  while (!domParentFiber.dom) domParentFiber = domParentFiber.parent;
  const domParent = domParentFiber.dom;

  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) domParent.appendChild(fiber.dom);
  else if (fiber.effectTag === "UPDATE" && fiber.dom != null) updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  else if (fiber.effectTag === "DELETION") commitDeletion(fiber, domParent);

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitDeletion(fiber, domParent) {
  if (fiber.dom) domParent.removeChild(fiber.dom);
  else commitDeletion(fiber.child, domParent);
}

function render(element, container) {
  wipRoot.current = {
    dom: container,
    props: { children: [element] },
    alternate: currentRoot.current,
  };

  deletions.current = [];
  nextUnitOfWork.current = wipRoot.current;
}

function workLoop(deadline) {
  let shouldYield = false;

  while (nextUnitOfWork.current && !shouldYield) {
    nextUnitOfWork.current = performUnitOfWork(nextUnitOfWork.current);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork.current && wipRoot.current) commitRoot();

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function performUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function;

  if (isFunctionComponent) updateFunctionComponent(fiber);
  else updateHostComponent(fiber);

  if (fiber.child) return fiber.child;

  let nextFiber = fiber;

  while (nextFiber) {
    if (nextFiber.sibling) return nextFiber.sibling;
    nextFiber = nextFiber.parent;
  }
}

function updateFunctionComponent(fiber) {
  resetHookState(fiber);

  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

function updateHostComponent(fiber) {
  if (!fiber.dom) fiber.dom = createDom(fiber);

  reconcileChildren(fiber, fiber.props.children);
}

function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;

  const oldFibersByKey = new Map();

  while (oldFiber) {
    const key = oldFiber.props.key || index;
    oldFibersByKey.set(key, oldFiber);
    oldFiber = oldFiber.sibling;
    index++;
  }

  index = 0;
  prevSibling = null;

  let newFiber = null;

  for (const element of elements) {
    const key = element.props.key || index;
    if (!element.props.key && process.env.NODE_ENV !== "production") console.warn("Warning: Each child in a list should have a unique 'key' prop.", element);

    const matchedOldFiber = oldFibersByKey.get(key);
    const sameType = matchedOldFiber && element && element.type === matchedOldFiber.type;

    if (sameType) {
      newFiber = {
        type: matchedOldFiber.type,
        props: element.props,
        dom: matchedOldFiber.dom,
        parent: wipFiber,
        alternate: matchedOldFiber,
        effectTag: "UPDATE",
      };
    } else {
      if (matchedOldFiber) {
        matchedOldFiber.effectTag = "DELETION";
        deletions.push(matchedOldFiber);
      }

      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      };
    }

    if (index === 0) wipFiber.child = newFiber;
    else if (prevSibling) prevSibling.sibling = newFiber;

    prevSibling = newFiber;
    index++;
  }

  for (const [key, oldFiber] of oldFibersByKey.entries()) {
    if (!elements.some((el) => (el.props.key || elements.indexOf(el)) === key)) {
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }
  }
}

const OregionDOM = {
  render,
};

export default OregionDOM;
