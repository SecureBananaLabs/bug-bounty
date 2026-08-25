/**
 * Async memoization utility with TTL (time-to-live) support.
 * 
 * @param {Function} fn - The async function to memoize
 * @param {Object} options - Configuration options
 * @param {number} options.ttlMs - Time to live in milliseconds (default: 60000)
 * @param {Function} options.keyResolver - Custom function to generate cache keys from arguments
 * @returns {Object} Memoized function with .clear() and .deleteKey(key) methods
 */
function memoizeAsync(fn, options = {}) {
  const { ttlMs = 60000, keyResolver = defaultKeyResolver } = options;
  
  const cache = new Map();
  const timers = new Map();
  
  /**
   * Default key resolver - creates a string key from arguments
   * @param {...any} args - Function arguments
   * @returns {string} Cache key
   */
  function defaultKeyResolver(...args) {
    return JSON.stringify(args);
  }
  
  /**
   * Clear expired entries from cache
   * @param {string} key - Cache key to check
   * @returns {boolean} True if entry was valid, false if expired/removed
   */
  function validateEntry(key) {
    const entry = cache.get(key);
    if (!entry) return false;
    
    const now = Date.now();
    if (now - entry.timestamp > ttlMs) {
      cache.delete(key);
      const timer = timers.get(key);
      if (timer) {
        clearTimeout(timer);
        timers.delete(key);
      }
      return false;
    }
    return true;
  }
  
  /**
   * Schedule automatic cleanup of an entry after TTL
   * @param {string} key - Cache key
   */
  function scheduleCleanup(key) {
    const existingTimer = timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    const timer = setTimeout(() => {
      cache.delete(key);
      timers.delete(key);
    }, ttlMs);
    
    timers.set(key, timer);
    // Allow process to exit even if timer is pending
    timer.unref?.();
  }
  
  /**
   * The memoized async function
   */
  async function memoized(...args) {
    const key = keyResolver(...args);
    
    // Return cached result if valid
    if (validateEntry(key)) {
      return cache.get(key).value;
    }
    
    // Execute the original function
    try {
      const result = await fn(...args);
      
      // Store in cache with timestamp
      cache.set(key, {
        value: result,
        timestamp: Date.now()
      });
      
      // Schedule cleanup
      scheduleCleanup(key);
      
      return result;
    } catch (error) {
      // Don't cache errors - re-throw
      throw error;
    }
  }
  
  /**
   * Clear all cached entries
   */
  memoized.clear = function() {
    // Clear all timers
    for (const timer of timers.values()) {
      clearTimeout(timer);
    }
    timers.clear();
    cache.clear();
  };
  
  /**
   * Delete a specific cache entry by key
   * @param {string} key - The cache key to delete
   * @returns {boolean} True if entry was found and deleted
   */
  memoized.deleteKey = function(key) {
    const timer = timers.get(key);
    if (timer) {
      clearTimeout(timer);
      timers.delete(key);
    }
    return cache.delete(key);
  };
  
  /**
   * Get cache statistics (for debugging/monitoring)
   * @returns {Object} Cache stats
   */
  memoized.getStats = function() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;
    
    for (const [, entry] of cache.entries()) {
      if (now - entry.timestamp > ttlMs) {
        expired++;
      } else {
        valid++;
      }
    }
    
    return {
      size: cache.size,
      valid,
      expired,
      ttlMs
    };
  };
  
  return memoized;
}

module.exports = { memoizeAsync };
