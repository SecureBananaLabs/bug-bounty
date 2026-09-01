/**
 * Prototype-safe LRU (Least Recently Used) Cache with optional TTL (Time To Live).
 */
export class LRUCache {
    /**
     * @param {number} capacity Maximum number of entries before eviction
     * @param {number} [defaultTtlMs=0] Default TTL in milliseconds (0 = no expiration)
     */
    constructor(capacity = 100, defaultTtlMs = 0) {
        if (!Number.isInteger(capacity) || capacity <= 0) {
            throw new TypeError("Capacity must be a positive integer.");
        }
        this.capacity = capacity;
        this.defaultTtlMs = Math.max(0, Number(defaultTtlMs) || 0);
        this._cache = new Map();
    }

    /**
     * Retrieves an item by key, refreshing its recency if valid.
     * @param {string|number|symbol} key
     * @returns {*|undefined}
     */
    get(key) {
        const entry = this._cache.get(key);
        if (!entry) return undefined;

        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            this._cache.delete(key);
            return undefined;
        }

        // Refresh recency
        this._cache.delete(key);
        this._cache.set(key, entry);
        return entry.value;
    }

    /**
     * Inserts or updates an item in the cache.
     * @param {string|number|symbol} key
     * @param {*} value
     * @param {number} [ttlMs] Optional custom TTL in ms
     */
    set(key, value, ttlMs = this.defaultTtlMs) {
        if (this._cache.has(key)) {
            this._cache.delete(key);
        } else if (this._cache.size >= this.capacity) {
            // Evict least recently used (first key in Map)
            const oldestKey = this._cache.keys().next().value;
            if (oldestKey !== undefined) {
                this._cache.delete(oldestKey);
            }
        }

        const expiresAt = ttlMs > 0 ? Date.now() + ttlMs : null;
        this._cache.set(key, { value, expiresAt });
        return this;
    }

    /**
     * Checks if key exists and is not expired.
     * @param {string|number|symbol} key
     * @returns {boolean}
     */
    has(key) {
        const entry = this._cache.get(key);
        if (!entry) return false;
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            this._cache.delete(key);
            return false;
        }
        return true;
    }

    /**
     * Removes an item by key.
     * @param {string|number|symbol} key
     * @returns {boolean}
     */
    delete(key) {
        return this._cache.delete(key);
    }

    /**
     * Clears all entries.
     */
    clear() {
        this._cache.clear();
    }

    /**
     * Current number of unexpired entries.
     * @returns {number}
     */
    get size() {
        this.pruneExpired();
        return this._cache.size;
    }

    /**
     * Prunes expired entries.
     * @returns {number} Number of pruned entries
     */
    pruneExpired() {
        let pruned = 0;
        const now = Date.now();
        for (const [key, entry] of this._cache.entries()) {
            if (entry.expiresAt && now > entry.expiresAt) {
                this._cache.delete(key);
                pruned++;
            }
        }
        return pruned;
    }
}