/**
 * Defensive query string builder with prototype pollution defense, deterministic key sorting,
 * multiple array serialization formats, nested object flattening, and custom encoding hooks.
 *
 * Implements defenses against:
 * - Prototype Pollution (CWE-1321) by screening dangerous keys (__proto__, constructor, prototype)
 * - Denial-of-Service via circular reference call stack exhaustion (CWE-400)
 * - Injection via improper URI encoding and parameter delimiters (CWE-116)
 * - Runtime type errors on null/primitive inputs (CWE-1287)
 */

const FORBIDDEN_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);

function isForbiddenKey(key) {
  if (typeof key !== 'string') return false;
  const lower = key.toLowerCase();
  if (FORBIDDEN_SEGMENTS.has(lower)) return true;

  // Screen segmented property paths (e.g. 'a[__proto__]', 'a.constructor', 'user[prototype][key]')
  const segments = lower.split(/[\.\[\]\/\s]+/).filter(Boolean);
  for (const seg of segments) {
    if (FORBIDDEN_SEGMENTS.has(seg)) {
      return true;
    }
  }
  return false;
}

function defaultEncode(val) {
  return encodeURIComponent(String(val));
}

/**
 * Builds a URL query string from an object of parameters.
 *
 * @param {Record<string, any>} params - Parameter object or collection
 * @param {object} [options={}] - Configuration options
 * @param {boolean|((a: string, b: string) => number)} [options.sort=true] - Deterministic sorting (alphabetical default or custom comparator)
 * @param {'brackets'|'indices'|'repeat'|'comma'} [options.arrayFormat='brackets'] - Array serialization format
 * @param {boolean|((val: any, key: string) => string)} [options.encode=true] - Percent-encoding strategy or custom encoder
 * @param {boolean} [options.encodeValuesOnly=false] - If true, encode values only, preserving keys raw
 * @param {boolean} [options.addQueryPrefix=false] - Whether to prepend '?' to non-empty query string
 * @param {boolean} [options.skipNull=false] - Whether to omit null values
 * @param {boolean} [options.skipUndefined=true] - Whether to omit undefined values
 * @param {boolean} [options.skipEmptyString=false] - Whether to omit empty string ("") values
 * @param {boolean} [options.strictNullHandling=false] - If true, serialize null as 'key' instead of 'key='
 * @param {boolean} [options.allowDots=false] - If true, format nested object keys using dot notation (a.b) instead of brackets (a[b])
 * @param {boolean|'throw'} [options.prototypeProtection=true] - Screen prototype pollution keys ('throw' raises TypeError)
 * @returns {string} Formatted query string
 */
export function buildQueryString(params, options = {}) {
  if (params === null || params === undefined || typeof params !== 'object') {
    return '';
  }

  if (options !== null && typeof options !== 'object') {
    throw new TypeError(`[buildQueryString] Expected options to be an object, received ${typeof options}`);
  }

  const opts = options || {};
  const {
    sort = true,
    arrayFormat = 'brackets',
    encode = true,
    encodeValuesOnly = false,
    addQueryPrefix = false,
    skipNull = false,
    skipUndefined = true,
    skipEmptyString = false,
    strictNullHandling = false,
    allowDots = false,
    prototypeProtection = true,
  } = opts;

  const validArrayFormats = new Set(['brackets', 'indices', 'repeat', 'comma']);
  if (!validArrayFormats.has(arrayFormat)) {
    throw new TypeError(
      `[buildQueryString] Invalid arrayFormat "${arrayFormat}". Expected one of: brackets, indices, repeat, comma`
    );
  }

  if (sort !== true && sort !== false && typeof sort !== 'function') {
    throw new TypeError(
      `[buildQueryString] Expected sort to be a boolean or a comparator function, received ${typeof sort}`
    );
  }

  if (prototypeProtection !== true && prototypeProtection !== false && prototypeProtection !== 'throw') {
    throw new TypeError(
      `[buildQueryString] Expected prototypeProtection to be a boolean or "throw", received ${typeof prototypeProtection}`
    );
  }

  const encodeKey = (key) => {
    if (encodeValuesOnly || encode === false) return String(key);
    if (typeof encode === 'function') return encode(key, key);
    return defaultEncode(key);
  };

  const encodeVal = (val, key) => {
    if (encode === false) return String(val);
    if (typeof encode === 'function') return encode(val, key);
    return defaultEncode(val);
  };

  const checkDangerousKey = (key) => {
    if (isForbiddenKey(key)) {
      if (prototypeProtection === 'throw') {
        throw new TypeError(`[buildQueryString] Prototype pollution key detected: "${key}"`);
      }
      return false;
    }
    return true;
  };

  const getSortedKeys = (obj) => {
    const keys = Object.keys(obj).filter((k) => Object.prototype.hasOwnProperty.call(obj, k));
    if (sort === true) {
      return keys.sort((a, b) => a.localeCompare(b));
    }
    if (typeof sort === 'function') {
      return keys.sort(sort);
    }
    return keys;
  };

  const pairs = [];
  const seenObjects = new Set();

  function serialize(obj, prefix = '') {
    if (obj === null || obj === undefined) {
      return;
    }

    if (typeof obj === 'object') {
      if (seenObjects.has(obj)) {
        // Prevent circular reference call stack exhaustion (CWE-400)
        return;
      }
      seenObjects.add(obj);
    }

    const keys = getSortedKeys(obj);

    for (const rawKey of keys) {
      if (prototypeProtection && !checkDangerousKey(rawKey)) {
        continue;
      }

      const fullKey = prefix
        ? allowDots
          ? `${prefix}.${rawKey}`
          : `${prefix}[${rawKey}]`
        : rawKey;

      if (prototypeProtection && prefix && !checkDangerousKey(fullKey)) {
        continue;
      }

      const val = obj[rawKey];

      if (val === undefined) {
        if (!skipUndefined) {
          pairs.push(`${encodeKey(fullKey)}=`);
        }
        continue;
      }

      if (val === null) {
        if (!skipNull) {
          if (strictNullHandling) {
            pairs.push(encodeKey(fullKey));
          } else {
            pairs.push(`${encodeKey(fullKey)}=`);
          }
        }
        continue;
      }

      if (val === '') {
        if (!skipEmptyString) {
          pairs.push(`${encodeKey(fullKey)}=`);
        }
        continue;
      }

      if (val instanceof Date) {
        if (Number.isNaN(val.getTime())) {
          if (!skipEmptyString) {
            pairs.push(`${encodeKey(fullKey)}=`);
          }
        } else {
          pairs.push(`${encodeKey(fullKey)}=${encodeVal(val.toISOString(), fullKey)}`);
        }
        continue;
      }

      if (Array.isArray(val)) {
        if (val.length === 0) {
          continue;
        }

        if (arrayFormat === 'comma') {
          const filtered = val.filter((item) => {
            if (item === undefined && skipUndefined) return false;
            if (item === null && skipNull) return false;
            return true;
          });
          if (filtered.length === 0) {
            continue;
          }
          const encodedItems = filtered.map((item) =>
            item === null || item === undefined ? '' : encodeVal(item, fullKey)
          );
          const delimiter = encode === false ? ',' : (typeof encode === 'function' ? ',' : '%2C');
          pairs.push(`${encodeKey(fullKey)}=${encodedItems.join(delimiter)}`);
          continue;
        }

        for (let i = 0; i < val.length; i++) {
          const item = val[i];
          if (item === undefined && skipUndefined) continue;
          if (item === null && skipNull) continue;

          let itemKey = fullKey;
          if (arrayFormat === 'brackets') {
            itemKey = `${fullKey}[]`;
          } else if (arrayFormat === 'indices') {
            itemKey = `${fullKey}[${i}]`;
          } // 'repeat' leaves itemKey as fullKey

          if (prototypeProtection && !checkDangerousKey(itemKey)) {
            continue;
          }

          if (item !== null && typeof item === 'object') {
            serialize(item, itemKey);
          } else if (item === null) {
            if (strictNullHandling) {
              pairs.push(encodeKey(itemKey));
            } else {
              pairs.push(`${encodeKey(itemKey)}=`);
            }
          } else {
            pairs.push(`${encodeKey(itemKey)}=${encodeVal(item, itemKey)}`);
          }
        }
        continue;
      }

      if (typeof val === 'object') {
        serialize(val, fullKey);
        continue;
      }

      // Primitive types (string, number, boolean, bigint)
      pairs.push(`${encodeKey(fullKey)}=${encodeVal(val, fullKey)}`);
    }

    if (typeof obj === 'object') {
      seenObjects.delete(obj);
    }
  }

  serialize(params);

  if (pairs.length === 0) {
    return '';
  }

  const queryString = pairs.join('&');
  return addQueryPrefix ? `?${queryString}` : queryString;
}

buildQueryString.buildQueryString = buildQueryString;

export default buildQueryString;
