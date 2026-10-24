/**
 * Creates a lightweight, isolated in-memory pub/sub Event Emitter instance
 * with listener error-boundary isolation and unsubscribe helpers.
 */
export function createEventEmitter() {
  /** @type {Map<string, Set<Function>>} */
  const listeners = new Map();

  const emitter = {
    /**
     * Subscribe a handler to an event.
     * @param {string} event - Event name
     * @param {Function} handler - Callback function
     * @returns {() => void} Unsubscribe function
     */
    on(event, handler) {
      if (typeof event !== 'string' || !event || typeof handler !== 'function') {
        return () => {};
      }
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event).add(handler);
      return () => {
        emitter.off(event, handler);
      };
    },

    /**
     * Subscribe a one-time handler that automatically unsubscribes before invoking.
     * @param {string} event - Event name
     * @param {Function} handler - Callback function
     * @returns {() => void} Unsubscribe function
     */
    once(event, handler) {
      if (typeof event !== 'string' || !event || typeof handler !== 'function') {
        return () => {};
      }
      const wrapper = (...args) => {
        emitter.off(event, wrapper);
        handler(...args);
      };
      wrapper._original = handler;
      return emitter.on(event, wrapper);
    },

    /**
     * Unsubscribe a handler from an event.
     * @param {string} event - Event name
     * @param {Function} handler - Callback function to remove
     */
    off(event, handler) {
      const set = listeners.get(event);
      if (!set) return;
      for (const fn of set) {
        if (fn === handler || fn._original === handler) {
          set.delete(fn);
        }
      }
      if (set.size === 0) {
        listeners.delete(event);
      }
    },

    /**
     * Emit an event with arguments to all registered listeners.
     * Isolates individual listener errors so subsequent handlers still execute.
     * @param {string} event - Event name
     * @param {...any} args - Arguments passed to listeners
     * @returns {number} Number of listeners invoked
     */
    emit(event, ...args) {
      const set = listeners.get(event);
      if (!set || set.size === 0) return 0;

      const snapshot = Array.from(set);
      let invoked = 0;
      for (const handler of snapshot) {
        invoked++;
        try {
          handler(...args);
        } catch {
          // Isolate handler exception so remaining listeners still fire
        }
      }
      return invoked;
    },

    /**
     * Returns the number of active listeners for a given event.
     * @param {string} event
     * @returns {number}
     */
    listenerCount(event) {
      const set = listeners.get(event);
      return set ? set.size : 0;
    },

    /**
     * Clears all listeners for a specific event or all events.
     * @param {string} [event]
     */
    clear(event) {
      if (typeof event === 'string') {
        listeners.delete(event);
      } else {
        listeners.clear();
      }
    }
  };

  return emitter;
}

export default createEventEmitter;
