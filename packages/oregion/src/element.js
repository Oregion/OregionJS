/**
 * @module oregion/element
 * Element creation utilities for Oregion.
 */

/**
 * Creates a text element for the virtual DOM.
 * @param {string} text - The text content.
 * @returns {Object} A text element object.
 */
function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

/**
 * Creates a virtual DOM element.
 * @param {string|Function} type - The element type (tag or component).
 * @param {Object} props - The element properties.
 * @param {...any} children - The child elements.
 * @returns {Object} A virtual DOM element.
 */
export function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) => (typeof child === "object" ? child : createTextElement(child))),
    },
  };
}

/** @type {string} Fragment component identifier. */
export const Fragment = "FRAGMENT";
