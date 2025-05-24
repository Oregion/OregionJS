/**
 * @module zepsh/utils
 * Utility functions for Zepsh.
 */

/**
 * Captures the component stack for error reporting.
 * @param {Object} fiber - The current fiber.
 * @returns {string} The component stack.
 */
export function captureOwnerStack(fiber) {
  const stack = [];
  let current = fiber;
  while (current) {
    if (typeof current.type === "function") {
      stack.push(current.type.name || "Anonymous");
    }
    current = current.parent;
  }
  return stack.reverse().join(" > ");
}

/**
 * Merges multiple refs into a single callback ref.
 * @param {Array<Function|Object>} refs - Array of refs (callback or RefObject).
 * @returns {Function} A callback ref that applies all refs.
 */
export function mergeRefs(refs) {
  return (node) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(node);
      } else if (ref && typeof ref === "object" && "current" in ref) {
        ref.current = node;
      }
    });
  };
}
