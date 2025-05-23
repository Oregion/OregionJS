/**
 * @module oregion/devtools
 * Devtools integration for Oregion (development mode only).
 */
import { globalState } from "./state";

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  window.__OREGION_DEVTOOLS__ = {
    getRoot: () => globalState.currentRoot,
    getWip: () => globalState.wipRoot,
    getHooks: () => globalState.wipFiber?.hooks || [],
  };
}
