/**
 * @module oregion/scheduler
 * Lightweight scheduler for concurrent rendering in Oregion.
 */

/**
 * @typedef {Object} Task
 * @property {Function} callback - The task to execute.
 * @property {number} priority - The task priority (lower is higher priority).
 */

/** @type {Task[]} Priority queue for tasks. */
const taskQueue = [];

/**
 * Schedules a task with a given priority.
 * @param {Function} callback - The task to schedule.
 * @param {number} [priority=0] - The task priority (lower is higher).
 */
export function scheduleTask(callback, priority = 0) {
  taskQueue.push({ callback, priority });
  taskQueue.sort((a, b) => a.priority - b.priority);
  requestIdleCallback(runTasks);
}

/**
 * Runs scheduled tasks within the available time.
 * @param {Object} deadline - The requestIdleCallback deadline.
 */
function runTasks(deadline) {
  while (taskQueue.length && deadline.timeRemaining() > 1) {
    const { callback } = taskQueue.shift();
    callback();
  }
  if (taskQueue.length) requestIdleCallback(runTasks);
}

const requestIdleCallback = typeof window !== "undefined" && window.requestIdleCallback ? window.requestIdleCallback : (cb) => setTimeout(() => cb({ timeRemaining: () => 50 }), 1);
