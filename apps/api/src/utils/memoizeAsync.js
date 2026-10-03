/**
 * @file memoizeAsync.js
 * Asynchronous function memoization with TTL expiration, in-flight promise deduplication, and cache invalidation.
 */

'use strict';

/**
 * Creates an asynchronous memoized wrapper for an async function.
 *
 * @param {Function} fn - The asynchronous function to memoize.
 * @param {Object} [options]
 * @param {number} [options.ttlMs] - Time-to-live in milliseconds for cached results.
 * @param {Function} [options.keyResolver] - Custom key generator function (...args) => string.
 * @param {number} [options.maxSize] - Maximum number of entries before oldest are pruned.
 * @returns {Function} Memoized async function with .clear(), .deleteKey(), .has(), and .size getters.
 */
export function memoizeAsync(fn, options = {}) {
  if (typeof fn !== 'function') {
    throw new TypeError(`Expected a function in memoizeAsync, received ${typeof fn}`);
  }

  const ttlMs = typeof options.ttlMs === 'number' && options.ttlMs > 0 ? options.ttlMs : Infinity;
  const keyResolver = typeof options.keyResolver === 'function' ? options.keyResolver : (...args) => JSON.stringify(args);
  const maxSize = typeof options.maxSize === 'number' && options.maxSize > 0 ? options.maxSize : 1000;

  const cache = new Map();

  async function memoized(...args) {
    const key = keyResolver(...args);
    const now = Date.now();

    if (cache.has(key)) {
      const entry = cache.get(key);
      if (entry.expiresAt > now) {
        return entry.promise ? entry.promise : entry.value;
      }
      cache.delete(key);
    }

    // Enforce maxSize
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }

    // In-flight promise deduplication
    const promise = (async () => {
      try {
        const value = await fn.apply(this, args);
        const expiresAt = ttlMs === Infinity ? Infinity : Date.now() + ttlMs;
        cache.set(key, { value, expiresAt, promise: null });
        return value;
      } catch (err) {
        cache.delete(key);
        throw err;
      }
    })();

    cache.set(key, {
      value: undefined,
      expiresAt: ttlMs === Infinity ? Infinity : now + ttlMs,
      promise,
    });

    return promise;
  }

  memoized.clear = function () {
    cache.clear();
  };

  memoized.deleteKey = function (...args) {
    const key = keyResolver(...args);
    return cache.delete(key);
  };

  memoized.has = function (...args) {
    const key = keyResolver(...args);
    if (!cache.has(key)) return false;
    const entry = cache.get(key);
    if (entry.expiresAt <= Date.now()) {
      cache.delete(key);
      return false;
    }
    return true;
  };

  Object.defineProperty(memoized, 'size', {
    get: function () {
      const now = Date.now();
      for (const [key, entry] of cache.entries()) {
        if (entry.expiresAt <= now) {
          cache.delete(key);
        }
      }
      return cache.size;
    },
    enumerable: true,
    configurable: true,
  });

  return memoized;
}
