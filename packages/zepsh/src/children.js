/**
 * @module zepsh/children
 * Utilities for manipulating props.children in Zepsh.
 */

/**
 * Children utilities for working with props.children.
 */
export const Children = {
  /**
   * Maps over children, applying a function to each child.
   * @param {any} children - The children to map over.
   * @param {Function} fn - The mapping function (child, index).
   * @returns {Array} The mapped children.
   */
  map(children, fn) {
    if (children == null) return [];
    const normalized = Children.toArray(children);
    return normalized.map((child, i) => fn(child, i));
  },

  /**
   * Iterates over children, applying a function to each child.
   * @param {any} children - The children to iterate over.
   * @param {Function} fn - The iteration function (child, index).
   */
  forEach(children, fn) {
    if (children == null) return;
    const normalized = Children.toArray(children);
    normalized.forEach((child, i) => fn(child, i));
  },

  /**
   * Counts the number of children.
   * @param {any} children - The children to count.
   * @returns {number} The number of children.
   */
  count(children) {
    if (children == null) return 0;
    return Children.toArray(children).length;
  },

  /**
   * Converts children to an array, normalizing fragments and text elements.
   * @param {any} children - The children to convert.
   * @returns {Array} An array of children.
   */
  toArray(children) {
    if (children == null) return [];
    if (!Array.isArray(children)) children = [children];
    return children
      .flatMap((child) => {
        if (child && child.type === "FRAGMENT") {
          return Children.toArray(child.props.children);
        }
        return child;
      })
      .filter(Boolean);
  },

  /**
   * Ensures only one child is provided.
   * @param {any} children - The children to check.
   * @returns {Object} The single child.
   * @throws {Error} If more or less than one child is provided.
   */
  only(children) {
    const normalized = Children.toArray(children);
    if (normalized.length !== 1) {
      throw new Error("Children.only expects exactly one child");
    }
    return normalized[0];
  },
};
