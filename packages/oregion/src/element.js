/**
 * @module oregion/element
 * Element creation utilities for Oregion.
 */
import { globalState } from "./state";

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

/**
 * Suspense component for handling asynchronous rendering.
 * @param {Object} props - The component props.
 * @param {Object} props.fallback - The fallback UI to render while suspended.
 * @param {Array} props.children - The child elements.
 * @returns {Object} The fallback or children based on suspension state.
 */
export function Suspense({ fallback, children }) {
  const fiber = globalState.wipFiber;
  if (fiber.suspended) {
    return fallback;
  }
  return children;
}

/**
 * ErrorBoundary component for catching errors in the child tree.
 * @param {Object} props - The component props.
 * @param {Object} props.fallback - The fallback UI to render on error.
 * @param {Array} props.children - The child elements.
 * @returns {Object} The fallback or children based on error state.
 */
export function ErrorBoundary({ fallback, children }) {
  const fiber = globalState.wipFiber;
  if (fiber.error) {
    return fallback;
  }
  return children;
}
