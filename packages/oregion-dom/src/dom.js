/**
 * @module oregion-dom/dom
 * DOM utilities for OregionDOM.
 */

/**
 * Creates a DOM node from a fiber.
 * @param {Object} fiber - The fiber to create a DOM node for.
 * @returns {Node|null} The created DOM node or null for fragments.
 */
export function createDom(fiber) {
  if (fiber.type === "TEXT_ELEMENT") return document.createTextNode(fiber.props.nodeValue || "");
  if (fiber.type === "FRAGMENT") return null;
  const dom = document.createElement(fiber.type);
  updateDom(dom, {}, fiber.props);
  return dom;
}

/**
 * Updates DOM properties and event listeners.
 * @param {Node} dom - The DOM node to update.
 * @param {Object} prevProps - Previous properties.
 * @param {Object} nextProps - Next properties.
 */
export function updateDom(dom, prevProps, nextProps) {
  const isEvent = (key) => key.startsWith("on");
  const isProperty = (key) => key !== "children" && !isEvent(key);
  const isNew = (key) => prevProps[key] !== nextProps[key];
  const isGone = (key) => !(key in nextProps);

  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => isGone(key) || isNew(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone)
    .forEach((name) => {
      dom[name] = "";
    });

  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew)
    .forEach((name) => {
      dom[name] = nextProps[name];
    });

  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew)
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}
