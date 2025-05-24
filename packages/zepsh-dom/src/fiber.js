/**
 * @module zepsh-dom/fiber
 * Fiber creation and reconciliation for ZepshDOM.
 */
import { globalState } from "../../zepsh/src/state";

/**
 * Creates a fiber object.
 * @param {Object} config - Fiber configuration.
 * @returns {Object} The fiber object.
 */
export function createFiber({ type, props, dom = null, parent = null, alternate = null, effectTag = null }) {
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

/**
 * Reconciles child fibers.
 * @param {Object} wipFiber - The work-in-progress fiber.
 * @param {Array} elements - The child elements.
 */
export function reconcileChildren(wipFiber, elements) {
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
    const key = element.props?.key || index;
    if (!element.props?.key && process.env.NODE_ENV !== "production") {
      console.warn("Warning: Each child in a list should have a unique 'key' prop.", element);
    }

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
