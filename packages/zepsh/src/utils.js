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
