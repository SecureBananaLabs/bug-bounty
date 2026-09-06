/**
 * Creates an async memoized function with TTL expiration and cache invalidation.
 * @template T
 * @param {(...args: any[]) => Promise<T>} fn - Async function to cache
 * @param {object} [options]
 * @param {number} [options.ttlMs=60000] - TTL cache duration in milliseconds
 * @param {(...args: any[]) => string} [options.keyResolver] - Custom cache key resolver
 * @returns {((...args: any[]) => Promise<T>) & { clear: () => void, deleteKey: (key: string) => boolean }}
 */
export function memoizeAsync(fn, options = {}) {
  const ttlMs = typeof options.ttlMs === 'number' && options.ttlMs > 0 ? options.ttlMs : 60000;
  const keyResolver = typeof options.keyResolver === 'function' ? options.keyResolver : (...args) => JSON.stringify(args);

  /** @type {Map<string, { value: T, expiry: number }>} */
  const cache = new Map();

  async function memoized(...args) {
    const key = keyResolver(...args);
    const now = Date.now();

    const cached = cache.get(key);
    if (cached && now < cached.expiry) {
      return cached.value;
    }

    const value = await fn(...args);
    cache.set(key, { value, expiry: now + ttlMs });
    return value;
  }

  memoized.clear = () => {
    cache.clear();
  };

  memoized.deleteKey = (key) => {
    return cache.delete(key);
  };

  return memoized;
}
