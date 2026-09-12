/**
 * High performance LRU Cache with TTL support and Prototype Pollution protection.
 * @param {Object} options
 * @param {number} [options.max=100] - Maximum cache capacity
 * @param {number} [options.ttl=0] - Time to live in ms (0 = infinite)
 */
export function createLRUCache(options = {}) {
  const max = typeof options.max === 'number' && options.max > 0 ? options.max : 100;
  const ttl = typeof options.ttl === 'number' && options.ttl > 0 ? options.ttl : 0;

  const cache = new Map();
  let hits = 0;
  let misses = 0;

  function isExpired(entry) {
    if (ttl <= 0) return false;
    return Date.now() - entry.timestamp > ttl;
  }

  function sanitizeKey(key) {
    const k = String(key);
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') {
      return null;
    }
    return k;
  }

  return {
    get(key) {
      const k = sanitizeKey(key);
      if (!k || !cache.has(k)) {
        misses++;
        return undefined;
      }

      const entry = cache.get(k);
      if (isExpired(entry)) {
        cache.delete(k);
        misses++;
        return undefined;
      }

      // Refresh position (LRU)
      cache.delete(k);
      cache.set(k, entry);
      hits++;
      return entry.value;
    },

    set(key, value) {
      const k = sanitizeKey(key);
      if (!k) return this;

      if (cache.has(k)) {
        cache.delete(k);
      } else if (cache.size >= max) {
        // Evict least recently used (first item in Map)
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }

      cache.set(k, {
        value,
        timestamp: Date.now(),
      });
      return this;
    },

    has(key) {
      const k = sanitizeKey(key);
      if (!k || !cache.has(k)) return false;
      const entry = cache.get(k);
      if (isExpired(entry)) {
        cache.delete(k);
        return false;
      }
      return true;
    },

    delete(key) {
      const k = sanitizeKey(key);
      if (!k) return false;
      return cache.delete(k);
    },

    clear() {
      cache.clear();
      hits = 0;
      misses = 0;
    },

    size() {
      return cache.size;
    },

    getStats() {
      return {
        size: cache.size,
        max,
        ttl,
        hits,
        misses,
        hitRatio: hits + misses === 0 ? 0 : hits / (hits + misses),
      };
    },
  };
}
