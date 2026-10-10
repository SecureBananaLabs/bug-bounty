/**
 * Create a lightweight event emitter with error isolation.
 * @returns {{ on: Function, once: Function, off: Function, emit: Function }}
 */
export function createEventEmitter() {
  const listeners = new Map();

  function on(event, handler) {
    if (typeof handler !== 'function') return;
    if (!listeners.has(event)) {
      listeners.set(event, []);
    }
    listeners.get(event).push(handler);
  }

  function once(event, handler) {
    const wrapper = (...args) => {
      off(event, wrapper);
      handler(...args);
    };
    on(event, wrapper);
  }

  function off(event, handler) {
    if (!listeners.has(event)) return;
    const handlers = listeners.get(event);
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
    if (handlers.length === 0) {
      listeners.delete(event);
    }
  }

  function emit(event, ...args) {
    if (!listeners.has(event)) return;
    const handlers = [...listeners.get(event)]; // snapshot to allow mutation during iteration
    for (const handler of handlers) {
      try {
        handler(...args);
      } catch (e) {
        // Error isolation: one failing handler doesn't stop others
        console.error(`[emitter] Error in handler for "${event}":`, e);
      }
    }
  }

  return { on, once, off, emit };
}
