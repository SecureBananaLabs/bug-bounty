const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * High-performance, prototype-safe Least Recently Used (LRU) Cache with TTL expiration
 * and hit/miss telemetry metrics.
 *
 * @param {object} [options]
 * @param {number} [options.max=100] - Maximum cache capacity before LRU eviction
 * @param {number} [options.ttl=0] - Default Time-To-Live in milliseconds (0 = no expiration)
 */
export function createLRUCache(options = {}) {
  const max =
    typeof options.max === 'number' && Number.isFinite(options.max) && options.max > 0
      ? Math.floor(options.max)
      : 100;
  const defaultTtl =
    typeof options.ttl === 'number' && Number.isFinite(options.ttl) && options.ttl > 0
      ? options.ttl
      : 0;

  /** @type {Map<string, { value: any, expiresAt: number }>} */
  const cache = new Map();
  let hits = 0;
  let misses = 0;

  function isSafeKey(key) {
    return typeof key === 'string' && !DANGEROUS_KEYS.has(key);
  }

  function isExpired(entry) {
    return entry.expiresAt > 0 && Date.now() >= entry.expiresAt;
  }

  const instance = {
    get(key) {
      const k = String(key);
      if (!isSafeKey(k) || !cache.has(k)) {
        misses++;
        return undefined;
      }

      const entry = cache.get(k);
      if (isExpired(entry)) {
        cache.delete(k);
        misses++;
        return undefined;
      }

      // Refresh LRU order
      cache.delete(k);
      cache.set(k, entry);
      hits++;
      return entry.value;
    },

    set(key, value, customTtl) {
      const k = String(key);
      if (!isSafeKey(k)) {
        return instance;
      }

      const ttlToUse =
        typeof customTtl === 'number' && Number.isFinite(customTtl) && customTtl >= 0
          ? customTtl
          : defaultTtl;
      const expiresAt = ttlToUse > 0 ? Date.now() + ttlToUse : 0;

      if (cache.has(k)) {
        cache.delete(k);
      } else if (cache.size >= max) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey !== undefined) {
          cache.delete(oldestKey);
        }
      }

      cache.set(k, { value, expiresAt });
      return instance;
    },

    has(key) {
      const k = String(key);
      if (!isSafeKey(k) || !cache.has(k)) {
        return false;
      }
      const entry = cache.get(k);
      if (isExpired(entry)) {
        cache.delete(k);
        return false;
      }
      return true;
    },

    delete(key) {
      const k = String(key);
      if (!isSafeKey(k)) return false;
      return cache.delete(k);
    },

    clear() {
      cache.clear();
      hits = 0;
      misses = 0;
    },

    get size() {
      return cache.size;
    },

    getStats() {
      return {
        hits,
        misses,
        size: cache.size,
        max
      };
    }
  };

  return instance;
}

export default createLRUCache;
