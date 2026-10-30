/**
 * Defensive EventBus utility with prototype pollution immunity,
 * async dispatch, error boundary, waitFor with AbortSignal/timeout,
 * and listener bounds protection (ref #743).
 */

export class TimeoutError extends Error {
  constructor(message, ms) {
    super(message);
    this.name = 'TimeoutError';
    this.code = 'ETIMEDOUT';
    this.timeout = ms;
  }
}

export class EventBus {
  /**
   * @param {Object} [options]
   * @param {number} [options.maxListeners=10] - Max listeners per event before warning (0 = unlimited).
   * @param {Function} [options.onError] - Error boundary callback (err, context) => void.
   */
  constructor(options = {}) {
    if (options !== null && typeof options !== 'object') {
      throw new TypeError('options must be an object');
    }

    const { maxListeners = 10, onError } = options || {};

    if (typeof maxListeners !== 'number' || !Number.isInteger(maxListeners) || maxListeners < 0) {
      throw new TypeError('maxListeners must be an integer >= 0');
    }

    if (onError !== undefined && typeof onError !== 'function') {
      throw new TypeError('onError must be a function');
    }

    this._maxListeners = maxListeners;
    this._onError = onError ?? null;
    // Map ensures complete isolation from Object.prototype, guaranteeing
    // prototype pollution immunity for event names (__proto__, constructor, prototype)
    this._events = new Map();
  }

  _validateEvent(event) {
    if ((typeof event !== 'string' && typeof event !== 'symbol') || (typeof event === 'string' && event.length === 0)) {
      throw new TypeError('event name must be a non-empty string or symbol');
    }
  }

  _validateListener(listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }
  }

  getMaxListeners() {
    return this._maxListeners;
  }

  setMaxListeners(n) {
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 0) {
      throw new TypeError('maxListeners must be an integer >= 0');
    }
    this._maxListeners = n;
    return this;
  }

  /**
   * Register a persistent event listener.
   */
  on(event, listener) {
    this._validateEvent(event);
    this._validateListener(listener);

    let list = this._events.get(event);
    if (!list) {
      list = [];
      this._events.set(event, list);
    }

    if (this._maxListeners > 0 && list.length >= this._maxListeners) {
      const warning = new Error(
        `MaxListenersExceededWarning: Possible EventBus memory leak detected. ` +
        `${list.length + 1} listeners added for event '${String(event)}'. Use setMaxListeners to increase limit.`
      );
      warning.name = 'MaxListenersExceededWarning';
      warning.event = event;
      warning.count = list.length + 1;
      if (typeof this._onError === 'function') {
        try {
          this._onError(warning, { event, listener, type: 'maxListeners' });
        } catch {
          // Do not allow error handler crashes to interrupt listener registration
        }
      }
    }

    const originalListener = listener.originalListener || listener;
    list.push({ fn: listener, originalListener, once: Boolean(listener.once) });
    return this;
  }

  /**
   * Register a one-time event listener.
   */
  once(event, listener) {
    this._validateEvent(event);
    this._validateListener(listener);

    const wrapper = (...args) => {
      this.off(event, wrapper);
      return listener.apply(this, args);
    };
    wrapper.originalListener = listener;
    wrapper.once = true;

    return this.on(event, wrapper);
  }

  /**
   * Remove an event listener.
   */
  off(event, listener) {
    this._validateEvent(event);
    this._validateListener(listener);

    const list = this._events.get(event);
    if (!list) return this;

    const idx = list.findIndex(
      (item) => item.fn === listener ||
                item.originalListener === listener ||
                (item.fn && item.fn.originalListener === listener)
    );

    if (idx !== -1) {
      list.splice(idx, 1);
      if (list.length === 0) {
        this._events.delete(event);
      }
    }

    return this;
  }

  removeListener(event, listener) {
    return this.off(event, listener);
  }

  /**
   * Synchronously invoke all listeners registered for the event.
   * Listener errors are captured by the onError boundary without halting emission.
   * Returns true if event had listeners, false otherwise.
   */
  emit(event, ...args) {
    this._validateEvent(event);

    const list = this._events.get(event);
    if (!list || list.length === 0) {
      if (event === 'error') {
        const err = args[0] instanceof Error ? args[0] : new Error(`Unhandled error event: ${args[0]}`);
        if (typeof this._onError === 'function') {
          this._onError(err, { event, args });
          return false;
        }
        throw err;
      }
      return false;
    }

    // Snapshot array so mutations inside listeners do not alter iteration order
    const snapshot = list.slice();

    for (const item of snapshot) {
      try {
        item.fn.apply(this, args);
      } catch (err) {
        if (typeof this._onError === 'function') {
          try {
            this._onError(err, { event, listener: item.originalListener || item.fn, args });
          } catch {
            // Defensive error boundary
          }
        } else if (event === 'error') {
          throw err;
        }
      }
    }

    return true;
  }

  /**
   * Asynchronously invoke all listeners registered for the event.
   * Returns a Promise resolving to an array of listener return values.
   */
  async emitAsync(event, ...args) {
    this._validateEvent(event);

    const list = this._events.get(event);
    if (!list || list.length === 0) {
      return [];
    }

    const snapshot = list.slice();
    const promises = snapshot.map(async (item) => {
      try {
        return await item.fn.apply(this, args);
      } catch (err) {
        if (typeof this._onError === 'function') {
          try {
            this._onError(err, { event, listener: item.originalListener || item.fn, args });
          } catch {}
          return undefined;
        }
        throw err;
      }
    });

    return Promise.all(promises);
  }

  /**
   * Wait for next emission of event.
   * Supports timeout (ms), AbortSignal, and optional predicate filter.
   */
  waitFor(event, options = {}) {
    this._validateEvent(event);

    if (options !== null && typeof options !== 'object') {
      throw new TypeError('options must be an object');
    }

    const { timeout, signal, filter } = options || {};

    if (signal !== undefined && (signal === null || typeof signal.aborted !== 'boolean' || typeof signal.addEventListener !== 'function')) {
      throw new TypeError('signal must be an AbortSignal');
    }
    if (timeout !== undefined && (typeof timeout !== 'number' || !Number.isFinite(timeout) || timeout <= 0)) {
      throw new TypeError('timeout must be a positive number');
    }
    if (filter !== undefined && typeof filter !== 'function') {
      throw new TypeError('filter must be a function');
    }

    if (signal && signal.aborted) {
      const err = signal.reason || new Error('The operation was aborted');
      if (!err.name) err.name = 'AbortError';
      return Promise.reject(err);
    }

    return new Promise((resolve, reject) => {
      let timer = null;
      let onAbort = null;
      let settled = false;

      const cleanup = () => {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        this.off(event, onEvent);
        if (signal && onAbort) {
          signal.removeEventListener('abort', onAbort);
        }
      };

      const onEvent = (...args) => {
        if (typeof filter === 'function') {
          try {
            if (!filter(...args)) return;
          } catch (filterErr) {
            cleanup();
            return reject(filterErr);
          }
        }
        cleanup();
        resolve(args.length <= 1 ? args[0] : args);
      };

      if (timeout) {
        timer = setTimeout(() => {
          cleanup();
          reject(new TimeoutError(`Operation timed out waiting for event '${String(event)}' after ${timeout}ms`, timeout));
        }, timeout);
      }

      if (signal) {
        onAbort = () => {
          cleanup();
          const err = signal.reason || new Error('The operation was aborted');
          if (!err.name) err.name = 'AbortError';
          reject(err);
        };
        signal.addEventListener('abort', onAbort, { once: true });
      }

      this.on(event, onEvent);
    });
  }

  listenerCount(event) {
    this._validateEvent(event);
    const list = this._events.get(event);
    return list ? list.length : 0;
  }

  listeners(event) {
    this._validateEvent(event);
    const list = this._events.get(event);
    if (!list) return [];
    return list.map((item) => item.originalListener || item.fn);
  }

  rawListeners(event) {
    this._validateEvent(event);
    const list = this._events.get(event);
    if (!list) return [];
    return list.map((item) => item.fn);
  }

  eventNames() {
    return Array.from(this._events.keys());
  }

  removeAllListeners(event) {
    if (event !== undefined) {
      this._validateEvent(event);
      this._events.delete(event);
    } else {
      this._events.clear();
    }
    return this;
  }
}

/**
 * Factory function creating an EventBus instance.
 */
export function createEventBus(options) {
  return new EventBus(options);
}

export default createEventBus;
