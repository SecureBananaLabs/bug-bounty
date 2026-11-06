const NO_ARGS_KEY = Symbol('memoize.no_args');

/**
 * Creates a function that memoizes the result of `fn`.
 *
 * Implements defenses against:
 * - Unbounded memory growth via LRU eviction limit (CWE-400)
 * - Stale cache retention via TTL expiration support
 * - Custom resolver crash defense with safe default fallback
 * - Key handling across primitives, objects, symbols, and no-arg invocations
 * - Strict type checking and cache management operations (clear, delete, get, has, set, size)
 *
 * @template {(...args: any[]) => any} T
 * @param {T} fn - The function to have its output memoized.
 * @param {((...args: any[]) => any)|object} [resolver] - Function to resolve the cache key, or options object.
 * @param {object} [options={}] - Configuration options.
 * @param {number} [options.maxSize=500] - Maximum number of entries in the LRU cache.
 * @param {number} [options.ttlMs] - Time-to-live in milliseconds for cached entries.
 * @param {boolean} [options.strict=false] - Whether to throw errors on invalid options or resolver failures.
 * @param {((key: any, value: any) => void)} [options.onEvict] - Callback fired when an entry is evicted.
 * @returns {T & { cache: MemoizeCache }} Returns the memoized function.
 */
export function memoize(fn, resolver, options = {}) {
  if (typeof fn !== 'function') {
    throw new TypeError(`[memoize] Expected first argument to be a function, received ${fn === null ? 'null' : typeof fn}`);
  }

  // Handle signature memoize(fn, options)
  let actualResolver = resolver;
  let actualOptions = options;

  if (typeof resolver === 'object' && resolver !== null) {
    actualOptions = resolver;
    actualResolver = undefined;
  }

  if (actualOptions !== undefined && (typeof actualOptions !== 'object' || actualOptions === null)) {
    throw new TypeError(`[memoize] Expected options to be an object, received ${actualOptions === null ? 'null' : typeof actualOptions}`);
  }

  const {
    maxSize = 500,
    ttlMs,
    strict = false,
    onEvict
  } = actualOptions || {};

  if (actualResolver !== undefined && typeof actualResolver !== 'function') {
    if (strict) {
      throw new TypeError(`[memoize] Expected resolver to be a function, received ${typeof actualResolver}`);
    }
    actualResolver = undefined;
  }

  let safeMaxSize = 500;
  if (maxSize !== undefined) {
    const numMax = Number(maxSize);
    if (!Number.isFinite(numMax) || Number.isNaN(numMax) || Math.floor(numMax) < 1) {
      if (strict) {
        throw new TypeError(`[memoize] Expected maxSize to be a positive integer >= 1, received ${maxSize}`);
      }
      safeMaxSize = 500;
    } else {
      safeMaxSize = Math.min(Math.floor(numMax), Number.MAX_SAFE_INTEGER);
    }
  }

  let safeTtl = Infinity;
  if (ttlMs !== undefined) {
    const numTtl = Number(ttlMs);
    if (!Number.isFinite(numTtl) || Number.isNaN(numTtl) || numTtl < 0) {
      if (strict) {
        throw new TypeError(`[memoize] Expected ttlMs to be a non-negative number, received ${ttlMs}`);
      }
      safeTtl = Infinity;
    } else {
      safeTtl = numTtl;
    }
  }

  /** @type {Map<any, { value: any, timestamp: number }>} */
  const map = new Map();

  function isExpired(entry) {
    if (safeTtl === Infinity || safeTtl <= 0) return false;
    return (Date.now() - entry.timestamp) > safeTtl;
  }

  function evictOldest() {
    if (map.size === 0) return;
    const oldestKey = map.keys().next().value;
    const entry = map.get(oldestKey);
    map.delete(oldestKey);
    if (typeof onEvict === 'function' && entry) {
      try {
        onEvict(oldestKey, entry.value);
      } catch {
        // Suppress onEvict errors in defensive mode
      }
    }
  }

  function resolveKey(args, context) {
    if (actualResolver) {
      try {
        return actualResolver.apply(context, args);
      } catch (err) {
        if (strict) {
          throw err;
        }
        // Fallback to primary arg
        return args.length === 0 ? NO_ARGS_KEY : args[0];
      }
    }
    return args.length === 0 ? NO_ARGS_KEY : args[0];
  }

  function memoized(...args) {
    const key = resolveKey(args, this);

    if (map.has(key)) {
      const entry = map.get(key);
      if (isExpired(entry)) {
        map.delete(key);
        if (typeof onEvict === 'function') {
          try { onEvict(key, entry.value); } catch {}
        }
      } else {
        // Refresh LRU order: delete and re-set
        map.delete(key);
        map.set(key, entry);
        return entry.value;
      }
    }

    const value = fn.apply(this, args);

    if (map.size >= safeMaxSize) {
      evictOldest();
    }

    map.set(key, { value, timestamp: Date.now() });
    return value;
  }

  const cache = {
    has(key) {
      if (!map.has(key)) return false;
      const entry = map.get(key);
      if (isExpired(entry)) {
        map.delete(key);
        if (typeof onEvict === 'function') {
          try { onEvict(key, entry.value); } catch {}
        }
        return false;
      }
      return true;
    },
    get(key) {
      if (!map.has(key)) return undefined;
      const entry = map.get(key);
      if (isExpired(entry)) {
        map.delete(key);
        if (typeof onEvict === 'function') {
          try { onEvict(key, entry.value); } catch {}
        }
        return undefined;
      }
      // Refresh LRU order
      map.delete(key);
      map.set(key, entry);
      return entry.value;
    },
    set(key, value) {
      if (map.has(key)) {
        map.delete(key);
      } else if (map.size >= safeMaxSize) {
        evictOldest();
      }
      map.set(key, { value, timestamp: Date.now() });
      return this;
    },
    delete(key) {
      return map.delete(key);
    },
    clear() {
      map.clear();
    },
    get size() {
      // Purge any expired entries before returning size
      if (safeTtl !== Infinity && safeTtl > 0) {
        const now = Date.now();
        for (const [k, entry] of map.entries()) {
          if ((now - entry.timestamp) > safeTtl) {
            map.delete(k);
            if (typeof onEvict === 'function') {
              try { onEvict(k, entry.value); } catch {}
            }
          }
        }
      }
      return map.size;
    },
    get raw() {
      return map;
    }
  };

  memoized.cache = cache;
  return memoized;
}

export default memoize;
