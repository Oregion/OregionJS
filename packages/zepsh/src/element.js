/**
 * @module zepsh/element
 * Element creation utilities for Zepsh.
 */
import { globalState } from "./state";
import { logProfile } from "./profiler";

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
    $$typeof: Symbol.for("zepsh.element"),
  };
}

/**
 * Clones an element with new props.
 * @param {Object} element - The element to clone.
 * @param {Object} props - New props to merge.
 * @param {...any} children - New children (optional).
 * @returns {Object} The cloned element.
 */
export function cloneElement(element, props, ...children) {
  if (!isValidElement(element)) {
    throw new Error("cloneElement expects a valid Zepsh element");
  }
  return {
    type: element.type,
    props: {
      ...element.props,
      ...props,
      children: children.length ? children.map((child) => (typeof child === "object" ? child : createTextElement(child))) : element.props.children,
    },
    $$typeof: Symbol.for("zepsh.element"),
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

/**
 * Memoizes a component to prevent unnecessary re-renders.
 * @param {Function} Component - The component to memoize.
 * @returns {Function} The memoized component.
 */
export function memo(Component) {
  return function MemoizedComponent(props) {
    const fiber = globalState.wipFiber;
    const oldFiber = fiber.alternate;
    if (oldFiber && oldFiber.type === Component) {
      const oldProps = oldFiber.props;
      const propsChanged = Object.keys(props).some((key) => !Object.is(props[key], oldProps[key]));
      if (!propsChanged) {
        fiber.skipRender = true;
        return oldFiber.props.children;
      }
    }
    return Component(props);
  };
}

/**
 * Profiler component for measuring rendering performance.
 * @param {Object} props - The component props.
 * @param {string} props.id - The profiler ID.
 * @param {Function} props.onRender - Callback to report rendering stats.
 * @param {Array} props.children - The child elements.
 * @returns {Array} The child elements.
 */
export function Profiler({ id, onRender, children }) {
  const fiber = globalState.wipFiber;
  if (process.env.NODE_ENV !== "production") {
    const startTime = performance.now();
    const phase = fiber.alternate ? "update" : "mount";
    const result = children;
    const actualDuration = performance.now() - startTime;
    logProfile(id, phase, actualDuration, startTime);
    if (onRender) {
      onRender(id, phase, actualDuration, startTime, fiber._debugName);
    }
    return result;
  }
  return children;
}

/**
 * StrictMode component for enabling development-time checks.
 * @param {Object} props - The component props.
 * @param {Array} props.children - The child elements.
 * @returns {Array} The child elements.
 */
export function StrictMode({ children }) {
  if (process.env.NODE_ENV !== "production") {
    const fiber = globalState.wipFiber;
    fiber.strictMode = true; // Mark fiber for double-rendering in dev
  }
  return children;
}

/**
 * ViewTransition component for smooth DOM transitions.
 * @param {Object} props - The component props.
 * @param {Array} props.children - The child elements.
 * @returns {Array} The child elements.
 */
export function ViewTransition({ children }) {
  if (typeof document !== "undefined" && document.startViewTransition) {
    document.startViewTransition(() => {
      globalState.wipRoot = {
        dom: globalState.currentRoot.dom,
        props: globalState.currentRoot.props,
        alternate: globalState.currentRoot,
      };
      globalState.nextUnitOfWork = globalState.wipRoot;
      globalState.deletions = [];
    });
  } else {
    // Fallback: simple fade animation
    const fiber = globalState.wipFiber;
    if (fiber.dom) {
      fiber.dom.style.transition = "opacity 0.3s";
      fiber.dom.style.opacity = "0";
      setTimeout(() => {
        fiber.dom.style.opacity = "1";
      }, 0);
    }
  }
  return children;
}
