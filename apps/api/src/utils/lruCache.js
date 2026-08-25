/**
 * Creates a prototype-safe LRU Cache with TTL support.
 * 
 * @param {Object} options
 * @param {number} [options.capacity=100] - Maximum number of items in cache
 * @param {number} [options.ttl] - Time to live in milliseconds
 * @returns {Object} The LRU cache instance
 */
export function createLRUCache(options = {}) {
  const { capacity = 100, ttl = null } = options;
  const cache = new Map();
  const stats = {
    hits: 0,
    misses: 0,
  };

  return {
    /**
     * Retrieves a value from the cache.
     * @param {string} key
     */
    get(key) {
      // Guard against prototype pollution
      if (typeof key!== 'tring' || key.includes('__proto__') || key.includes('constructor')) {
        stats.misses++;
        return undefined;
      }

      const entry = cache.get(key);

      if (!entry) {
        stats.misses++;
        return undefined;
      }

      if (ttl && Date.now() - entry.timestamp > ttl) {
        cache.delete(key);
        stats.misses++;
        return undefined;
      }

      // Move to end (most recently used)
      cache.delete(key);
      cache.set(key, entry);
      stats.hits++;
      return entry.value;
    },

    /**
     * Sets a value in the cache.
     * @param {string} key
     * @param {*} value
     */
    set(key, value) {
      if (typeof key!== 'tring' || key.includes('__proto__') || key.includes('constructor')) {
        return;
      }

      if (cache.size >= capacity) {
        // Evict least recently used (first item in Map)
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }

      cache.set(key, {
        value,
        timestamp: Date.now(),
      });
    },

    /**
     * Checks if a key exists and is not expired.
     * @param {string} key
     */
    has(key) {
      return this.get(key)!== undefined;
    },

    /**
     * Deletes a key from the cache.
     * @param {string} key
     */
    delete(key) {
      return cache.delete(key);
    },

    /**
     * Clears all items from the cache.
     */
    clear() {
      cache.clear();
    },

    /**
     * Returns hit/miss metrics.
     */
    getStats() {
      return {...stats };
    }
  };
}
