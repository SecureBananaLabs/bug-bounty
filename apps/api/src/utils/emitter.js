/**
 * @file emitter.js
 * Lightweight isolated event emitter for decoupled pub/sub messaging.
 */

'use strict';

/**
 * Creates an isolated pub/sub event emitter instance.
 *
 * @param {Object} [options]
 * @param {Function} [options.onError] - Optional global error handler when a listener throws.
 * @returns {Object} Emitter instance with on, once, off, emit, listenerCount, removeAllListeners.
 */
export function createEventEmitter(options = {}) {
  const events = new Map();
  const onError = typeof options.onError === 'function' ? options.onError : null;

  function on(event, handler) {
    if (typeof handler !== 'function') {
      throw new TypeError(`Listener for event "${event}" must be a function, received ${typeof handler}`);
    }

    if (!events.has(event)) {
      events.set(event, new Set());
    }

    events.get(event).add(handler);

    // Return unsubscribe function
    return () => off(event, handler);
  }

  function once(event, handler) {
    if (typeof handler !== 'function') {
      throw new TypeError(`Listener for event "${event}" must be a function, received ${typeof handler}`);
    }

    const wrapper = (...args) => {
      off(event, wrapper);
      return handler(...args);
    };

    // Store reference to original handler for off() lookup
    wrapper._original = handler;

    return on(event, wrapper);
  }

  function off(event, handler) {
    if (!events.has(event)) {
      return;
    }

    const listeners = events.get(event);
    if (listeners.has(handler)) {
      listeners.delete(handler);
    } else {
      // Check for wrapped once listeners
      for (const listener of listeners) {
        if (listener._original === handler) {
          listeners.delete(listener);
          break;
        }
      }
    }

    if (listeners.size === 0) {
      events.delete(event);
    }
  }

  function emit(event, ...args) {
    if (!events.has(event)) {
      return false;
    }

    // Clone listener set to prevent mutation issues during iteration
    const listeners = Array.from(events.get(event));
    let delivered = false;

    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      try {
        listener(...args);
        delivered = true;
      } catch (err) {
        if (onError) {
          try {
            onError(err, event);
          } catch {
            // Prevent error handler crash
          }
        }
        // Continue invoking other listeners
      }
    }

    return delivered;
  }

  function listenerCount(event) {
    if (!events.has(event)) {
      return 0;
    }
    return events.get(event).size;
  }

  function removeAllListeners(event) {
    if (event !== undefined) {
      events.delete(event);
    } else {
      events.clear();
    }
  }

  return {
    on,
    once,
    off,
    emit,
    listenerCount,
    removeAllListeners,
  };
}
