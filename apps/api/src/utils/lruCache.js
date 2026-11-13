/**
 * Defensive LRU Cache utility with O(1) Map operations, TTL expiration,
 * eviction callbacks, and prototype pollution immunity (ref #743).
 */

function validateOptions(options) {
  if (options === undefined || options === null) return {};
  if (typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('options must be an object');
  }
  return options;
}

export class LRUCache {
  /**
   * @param {number} capacity - Maximum number of entries cache can hold (positive integer).
   * @param {Object} [options]
   * @param {number} [options.ttl] - Default time-to-live in milliseconds.
   * @param {Function} [options.onEvict] - Eviction callback: (key, value, reason) => void.
   */
  constructor(capacity, options) {
    if (typeof capacity !== 'number' || !Number.isInteger(capacity) || capacity <= 0) {
      throw new TypeError('capacity must be a positive integer');
    }

    const opts = validateOptions(options);

    if (opts.ttl !== undefined) {
      if (typeof opts.ttl !== 'number' || !Number.isFinite(opts.ttl) || opts.ttl <= 0) {
        throw new TypeError('ttl must be a positive number');
      }
    }

    if (opts.onEvict !== undefined && typeof opts.onEvict !== 'function') {
      throw new TypeError('onEvict must be a function');
    }

    this._capacity = capacity;
    this._defaultTTL = opts.ttl ?? null;
    this._onEvict = opts.onEvict ?? null;
    // Map guarantees insertion order for O(1) LRU eviction and prototype pollution immunity
    this._map = new Map();
  }

  get capacity() {
    return this._capacity;
  }

  get size() {
    this._purgeExpired();
    return this._map.size;
  }

  _isExpired(entry) {
    return entry.expiresAt !== null && entry.expiresAt <= Date.now();
  }

  _notifyEvict(key, value, reason) {
    if (typeof this._onEvict === 'function') {
      try {
        this._onEvict(key, value, reason);
      } catch {
        // Defensive error boundary: user callback errors must not crash internal cache state
      }
    }
  }

  _purgeExpired() {
    const now = Date.now();
    for (const [key, entry] of this._map.entries()) {
      if (entry.expiresAt !== null && entry.expiresAt <= now) {
        this._map.delete(key);
        this._notifyEvict(key, entry.value, 'expire');
      }
    }
  }

  /**
   * Check if a key exists without updating recency.
   * Expired keys are evicted and return false.
   */
  has(key) {
    if (!this._map.has(key)) return false;
    const entry = this._map.get(key);
    if (this._isExpired(entry)) {
      this._map.delete(key);
      this._notifyEvict(key, entry.value, 'expire');
      return false;
    }
    return true;
  }

  /**
   * Retrieve an item and mark it as most recently used (O(1)).
   */
  get(key) {
    if (!this._map.has(key)) return undefined;
    const entry = this._map.get(key);
    if (this._isExpired(entry)) {
      this._map.delete(key);
      this._notifyEvict(key, entry.value, 'expire');
      return undefined;
    }
    // Update recency by re-inserting at the end of the Map
    this._map.delete(key);
    this._map.set(key, entry);
    return entry.value;
  }

  /**
   * Retrieve an item without updating recency.
   */
  peek(key) {
    if (!this._map.has(key)) return undefined;
    const entry = this._map.get(key);
    if (this._isExpired(entry)) {
      this._map.delete(key);
      this._notifyEvict(key, entry.value, 'expire');
      return undefined;
    }
    return entry.value;
  }

  /**
   * Store a key-value pair. Evicts the oldest entry if capacity is exceeded.
   * @param {*} key - Cache key (immune to prototype pollution).
   * @param {*} value - Cache value.
   * @param {Object} [options]
   * @param {number} [options.ttl] - Per-item TTL override in milliseconds.
   */
  set(key, value, options) {
    const opts = validateOptions(options);
    let ttl = this._defaultTTL;
    if (opts.ttl !== undefined) {
      if (typeof opts.ttl !== 'number' || !Number.isFinite(opts.ttl) || opts.ttl <= 0) {
        throw new TypeError('item ttl must be a positive number');
      }
      ttl = opts.ttl;
    }

    const expiresAt = ttl ? Date.now() + ttl : null;

    if (this._map.has(key)) {
      this._map.delete(key);
      this._map.set(key, { value, expiresAt });
      return this;
    }

    // Purge expired entries if approaching capacity
    if (this._map.size >= this._capacity) {
      this._purgeExpired();
    }

    // If still at capacity, evict least recently used (first Map entry)
    if (this._map.size >= this._capacity) {
      const oldestKey = this._map.keys().next().value;
      const oldestEntry = this._map.get(oldestKey);
      this._map.delete(oldestKey);
      this._notifyEvict(oldestKey, oldestEntry.value, 'evict');
    }

    this._map.set(key, { value, expiresAt });
    return this;
  }

  /**
   * Delete an item by key.
   */
  delete(key) {
    if (!this._map.has(key)) return false;
    const entry = this._map.get(key);
    this._map.delete(key);
    this._notifyEvict(key, entry.value, 'delete');
    return true;
  }

  /**
   * Remove all entries.
   */
  clear() {
    if (this._onEvict) {
      for (const [key, entry] of this._map.entries()) {
        this._notifyEvict(key, entry.value, 'clear');
      }
    }
    this._map.clear();
  }

  /**
   * Prune all expired entries and return the count pruned.
   */
  prune() {
    const before = this._map.size;
    this._purgeExpired();
    return before - this._map.size;
  }

  *keys() {
    this._purgeExpired();
    yield* this._map.keys();
  }

  *values() {
    this._purgeExpired();
    for (const entry of this._map.values()) {
      yield entry.value;
    }
  }

  *entries() {
    this._purgeExpired();
    for (const [k, entry] of this._map.entries()) {
      yield [k, entry.value];
    }
  }

  [Symbol.iterator]() {
    return this.entries();
  }
}

/**
 * Factory function creating an LRUCache instance.
 */
export function createLRUCache(capacity, options) {
  return new LRUCache(capacity, options);
}

export default createLRUCache;
