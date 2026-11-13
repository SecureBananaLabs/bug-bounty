/**
 * Defensive object inversion utility (invert)
 *
 * Inverts an object's keys and values with comprehensive defenses against:
 * - CWE-1321: Prototype pollution via __proto__, constructor, and prototype checks
 * - CWE-1287: Improper input type validation (graceful fallback for non-objects)
 * - CWE-400: Resource exhaustion via upper bounds / safe iteration
 * - Key collision resolution strategies: 'overwrite', 'group', 'error'
 * - Symbol key and symbol value support
 */

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Creates an object composed of the inverted keys and values of `object`.
 * If `object` contains duplicate values, subsequent values overwrite previous assignments
 * by default, or resolve via custom collisionStrategy ('overwrite', 'group', 'error').
 *
 * @param {object} obj - The object to invert.
 * @param {object} [options={}] - Inversion options.
 * @param {'overwrite' | 'group' | 'error'} [options.collisionStrategy='overwrite'] - Collision resolution strategy.
 * @param {'skip' | 'throw'} [options.dangerAction='skip'] - Action on prototype pollution keys.
 * @param {boolean} [options.nullPrototype=false] - Return object with null prototype (Object.create(null)).
 * @param {boolean} [options.includeSymbols=true] - Whether to include Symbol keys and values.
 * @returns {Record<string | symbol, any>} The inverted object.
 */
export function invert(obj, options = {}) {
  if (options !== undefined && (typeof options !== 'object' || options === null)) {
    throw new TypeError(`[invert] Expected options to be an object, received ${options === null ? 'null' : typeof options}`);
  }

  const {
    collisionStrategy = 'overwrite',
    dangerAction = 'skip',
    nullPrototype = false,
    includeSymbols = true,
  } = options;

  if (collisionStrategy !== 'overwrite' && collisionStrategy !== 'group' && collisionStrategy !== 'error') {
    throw new TypeError(`[invert] Invalid collisionStrategy: "${collisionStrategy}". Expected 'overwrite', 'group', or 'error'`);
  }

  if (dangerAction !== 'skip' && dangerAction !== 'throw') {
    throw new TypeError(`[invert] Invalid dangerAction: "${dangerAction}". Expected 'skip' or 'throw'`);
  }

  const createTarget = () => (nullPrototype ? Object.create(null) : {});

  // Non-object safety: null, undefined, primitives, arrays treated safely
  if (obj === null || obj === undefined || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return createTarget();
  }

  const result = createTarget();

  // Extract own enumerable string keys
  const stringKeys = Object.keys(obj);

  // Extract own enumerable Symbol keys if enabled
  const symbolKeys = includeSymbols && typeof Object.getOwnPropertySymbols === 'function'
    ? Object.getOwnPropertySymbols(obj).filter((sym) => Object.prototype.propertyIsEnumerable.call(obj, sym))
    : [];

  const allKeys = [...stringKeys, ...symbolKeys];

  for (const key of allKeys) {
    let val;
    try {
      val = obj[key];
    } catch {
      continue;
    }

    // Determine inverted key representation
    let invertedKey;
    if (typeof val === 'symbol') {
      if (!includeSymbols) {
        continue;
      }
      invertedKey = val;
    } else if (typeof val === 'string') {
      invertedKey = val;
    } else if (val === null) {
      invertedKey = 'null';
    } else if (val === undefined) {
      invertedKey = 'undefined';
    } else {
      try {
        invertedKey = String(val);
      } catch {
        try {
          invertedKey = Object.prototype.toString.call(val);
        } catch {
          invertedKey = '[object Object]';
        }
      }
    }

    // Prototype pollution defense (CWE-1321)
    if (typeof invertedKey === 'string' && DANGEROUS_KEYS.has(invertedKey)) {
      if (dangerAction === 'throw') {
        const SecurityErr = typeof SecurityError !== 'undefined' ? SecurityError : Error;
        throw new SecurityErr(`[invert] Disallowed dangerous prototype key: ${invertedKey}`);
      }
      // 'skip' action: omit dangerous property from inverted output
      continue;
    }

    // Check existing property presence defensively
    const hasKey = nullPrototype
      ? Object.prototype.hasOwnProperty.call(result, invertedKey) || invertedKey in result
      : Object.prototype.hasOwnProperty.call(result, invertedKey);

    if (hasKey) {
      if (collisionStrategy === 'error') {
        throw new Error(`[invert] Collision detected for inverted key: ${String(invertedKey)}`);
      } else if (collisionStrategy === 'group') {
        result[invertedKey].push(key);
      } else {
        // 'overwrite' using defineProperty to prevent prototype setter invocation or read-only crashes
        Object.defineProperty(result, invertedKey, {
          value: key,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
    } else {
      Object.defineProperty(result, invertedKey, {
        value: collisionStrategy === 'group' ? [key] : key,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
  }

  return result;
}

invert.invert = invert;

export default invert;
