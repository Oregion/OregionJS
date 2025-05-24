/**
 * @module zepsh/form
 * Form scope utilities for Zepsh.
 */
import { createContext, useContext, useActionState } from "./hooks";

/**
 * Creates a form scope for managing form state and actions.
 * @returns {Object} An object with Provider and useForm for form scoping.
 */
export function createFormScope() {
  const FormContext = createContext(null);

  /**
   * Provider component for the form scope.
   * @param {Object} props - The component props.
   * @param {Function} props.action - The async form action.
   * @param {any} props.initialState - The initial form state.
   * @param {Array} props.children - The child elements.
   * @returns {Array} The child elements wrapped in context.
   */
  function Provider({ action, initialState, children }) {
    const [state, submit, isPending] = useActionState(action, initialState);
    return <FormContext.Provider value={{ state, submit, isPending }}>{children}</FormContext.Provider>;
  }

  /**
   * Hook to access the form scope.
   * @returns {Object} The form state, submit function, and pending status.
   * @throws {Error} If used outside a FormScope Provider.
   */
  function useForm() {
    const context = useContext(FormContext);
    if (!context) {
      throw new Error("useForm must be used within a FormScope Provider");
    }
    return context;
  }

  return { Provider, useForm };
}
