/**
 * Creates an isolated in-memory Event Emitter instance.
 */
export function createEventEmitter() {
  /** @type {Map<string, Set<Function>>} */
  const listeners = new Map();

  return {
    /**
     * Subscribe a handler to an event.
     * @param {string} event - Event name
     * @param {Function} handler - Callback function
     * @returns {() => void} Unsubscribe function
     */
    on(event, handler) {
      if (typeof event !== 'string' || typeof handler !== 'function') return () => {};
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event).add(handler);

      return () => this.off(event, handler);
    },

    /**
     * Subscribe a one-time handler.
     * @param {string} event - Event name
     * @param {Function} handler - Callback function
     * @returns {() => void} Unsubscribe function
     */
    once(event, handler) {
      if (typeof event !== 'string' || typeof handler !== 'function') return () => {};
      const wrapper = (...args) => {
        this.off(event, wrapper);
        handler(...args);
      };
      return this.on(event, wrapper);
    },

    /**
     * Unsubscribe a handler from an event.
     * @param {string} event - Event name
     * @param {Function} handler - Callback function
     */
    off(event, handler) {
      if (!listeners.has(event)) return;
      listeners.get(event).delete(handler);
      if (listeners.get(event).size === 0) {
        listeners.delete(event);
      }
    },

    /**
     * Emit an event to all registered listeners.
     * @param {string} event - Event name
     * @param {...any} args - Arguments passed to listeners
     */
    emit(event, ...args) {
      if (!listeners.has(event)) return;
      const handlers = Array.from(listeners.get(event));
      for (const handler of handlers) {
        try {
          handler(...args);
        } catch (err) {
          console.error(`[EventEmitter] Handler error on event "${event}":`, err);
        }
      }
    },

    /**
     * Clear all listeners for an event or all events.
     * @param {string} [event]
     */
    clear(event) {
      if (event) {
        listeners.delete(event);
      } else {
        listeners.clear();
      }
    },

    /**
     * Get listener count for an event.
     * @param {string} event
     * @returns {number}
     */
    listenerCount(event) {
      return listeners.has(event) ? listeners.get(event).size : 0;
    },
  };
}
