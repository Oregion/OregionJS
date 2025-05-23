/**
 * @module oregion/profiler
 * Profiler utilities for measuring rendering performance in development.
 */

/** @type {Map<string, Array<{id: string, phase: string, actualDuration: number, startTime: number}>>} */
const profiles = new Map();

/**
 * Logs profiling data for a component.
 * @param {string} id - The profiler ID.
 * @param {string} phase - The rendering phase (mount or update).
 * @param {number} actualDuration - The time taken to render (ms).
 * @param {number} startTime - The start time of rendering.
 */
export function logProfile(id, phase, actualDuration, startTime) {
  if (process.env.NODE_ENV !== "production") {
    if (!profiles.has(id)) profiles.set(id, []);
    profiles.get(id).push({ id, phase, actualDuration, startTime });
    if (typeof window !== "undefined" && window.__OREGION_DEVTOOLS__) {
      window.__OREGION_DEVTOOLS__.profiles = profiles;
    }
  }
}
