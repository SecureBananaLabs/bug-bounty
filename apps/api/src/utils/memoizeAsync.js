/**
 * Creates an asynchronous memoized function with TTL expiration, in-flight promise deduplication,
 * automatic error eviction, and manual cache invalidation methods.
 *
 * @template T
 * @param {(...args: any[]) => Promise<T>} fn - Async function to cache
 * @param {object} [options]
 * @param {number} [options.ttlMs=60000] - Cache Time-To-Live in milliseconds
 * @param {(...args: any[]) => string} [options.keyResolver] - Custom cache key generator
 * @returns {((...args: any[]) => Promise<T>) & { clear: () => void, deleteKey: (key: string) => boolean, size: () => number }}
 */
export function memoizeAsync(fn, options = {}) {
  if (typeof fn !== 'function') {
    throw new TypeError('Expected a function to memoize');
  }

  const ttlMs =
    typeof options.ttlMs === 'number' && Number.isFinite(options.ttlMs) && options.ttlMs >= 0
      ? options.ttlMs
      : 60000;

  const keyResolver =
    typeof options.keyResolver === 'function'
      ? options.keyResolver
      : (...args) => JSON.stringify(args);

  /** @type {Map<string, { promise: Promise<T>, expiresAt: number }>} */
  const cache = new Map();

  const memoized = async function (...args) {
    const key = String(keyResolver(...args));
    const now = Date.now();
    const existing = cache.get(key);

    if (existing && now < existing.expiresAt) {
      return existing.promise;
    }

    if (existing) {
      cache.delete(key);
    }

    const promise = Promise.resolve()
      .then(() => fn.apply(this, args))
      .catch((err) => {
        cache.delete(key);
        throw err;
      });

    cache.set(key, {
      promise,
      expiresAt: now + ttlMs
    });

    return promise;
  };

  memoized.clear = () => {
    cache.clear();
  };

  memoized.deleteKey = (key) => {
    return cache.delete(String(key));
  };

  memoized.size = () => {
    return cache.size;
  };

  return memoized;
}

export default memoizeAsync;
