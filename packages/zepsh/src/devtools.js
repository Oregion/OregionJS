/**
 * @module zepsh/devtools
 * Devtools integration for Zepsh (development mode only).
 */
import { globalState } from "./state";

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  window.__ZEPSH_DEVTOOLS__ = {
    getRoot: () => globalState.currentRoot,
    getWip: () => globalState.wipRoot,
    getHooks: () => globalState.wipFiber?.hooks || [],
  };
}
