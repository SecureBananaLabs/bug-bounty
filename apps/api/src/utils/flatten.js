/**
 * Flattens array a single level deep or up to a specified depth.
 *
 * Implements defenses against:
 * - Recursion stack overflow via configurable maxDepth cap (CWE-674)
 * - Circular reference detection and cycle termination using WeakSet
 * - Sparse array hole defense preventing Array.prototype pollution inheritance
 * - Non-array and null/undefined input fallbacks
 * - Strict type checking option
 * - Configurable cycle handling ('preserve' | 'skip' | 'throw')
 *
 * @template T
 * @param {any[]} array - The array to flatten.
 * @param {number} [depth=1] - The maximum recursion depth.
 * @param {object} [options={}] - Configuration options.
 * @param {boolean} [options.strict=false] - Whether to throw TypeError on invalid inputs.
 * @param {boolean} [options.skipHoles=false] - Whether to omit sparse array holes.
 * @param {number} [options.maxDepth=1000] - Hard recursion safety cap.
 * @param {'preserve'|'skip'|'throw'} [options.onCircular='preserve'] - Action when circular array is encountered.
 * @returns {any[]} Returns the new flattened array.
 */
export function flatten(array, depth = 1, options = {}) {
  if (options !== undefined && (typeof options !== 'object' || options === null)) {
    throw new TypeError(`[flatten] Expected options to be an object, received ${options === null ? 'null' : typeof options}`);
  }

  const {
    strict = false,
    skipHoles = false,
    maxDepth = 1000,
    onCircular = 'preserve'
  } = options;

  if (!Array.isArray(array)) {
    if (strict) {
      throw new TypeError(`[flatten] Expected first argument to be an Array, received ${array === null ? 'null' : typeof array}`);
    }
    return [];
  }

  if (array.length === 0) {
    return [];
  }

  const validActions = ['preserve', 'skip', 'throw'];
  if (!validActions.includes(onCircular)) {
    throw new TypeError(`[flatten] Invalid onCircular option: "${onCircular}". Expected one of: ${validActions.join(', ')}`);
  }

  const rawMaxDepth = Number(maxDepth);
  const safeMaxDepth = (!Number.isFinite(rawMaxDepth) || rawMaxDepth < 0)
    ? 1000
    : Math.floor(rawMaxDepth);

  const rawDepth = Number(depth);
  if (Number.isNaN(rawDepth)) {
    if (strict) {
      throw new TypeError(`[flatten] Expected depth to be a number, received NaN`);
    }
    // Return shallow copy
    return copyArray(array, skipHoles);
  }

  if (strict && rawDepth > safeMaxDepth) {
    throw new RangeError(`[flatten] Requested depth ${rawDepth} exceeds maximum configured recursion limit of ${safeMaxDepth}`);
  }

  if (rawDepth <= 0) {
    return copyArray(array, skipHoles);
  }

  const effectiveDepth = Math.min(
    Math.floor(rawDepth),
    safeMaxDepth
  );

  const seen = new WeakSet();

  function flattenInternal(arr, currentDepth) {
    if (seen.has(arr)) {
      if (onCircular === 'throw') {
        throw new TypeError('[flatten] Circular array reference detected');
      }
      if (onCircular === 'skip') {
        return [];
      }
      return [arr];
    }

    seen.add(arr);
    const result = [];
    const len = arr.length;

    for (let i = 0; i < len; i++) {
      const hasOwn = Object.prototype.hasOwnProperty.call(arr, i);

      if (!hasOwn) {
        if (!skipHoles) {
          // Isolate from Array.prototype pollution
          result.push(undefined);
        }
        continue;
      }

      const item = arr[i];

      if (Array.isArray(item) && currentDepth > 0) {
        if (seen.has(item)) {
          if (onCircular === 'throw') {
            throw new TypeError('[flatten] Circular array reference detected');
          }
          if (onCircular === 'skip') {
            continue;
          }
          result.push(item);
        } else {
          const nested = flattenInternal(item, currentDepth - 1);
          result.push(...nested);
        }
      } else {
        result.push(item);
      }
    }

    seen.delete(arr);
    return result;
  }

  return flattenInternal(array, effectiveDepth);
}

/**
 * Defensive shallow copy of an array isolating sparse holes against Array.prototype pollution.
 * @private
 */
function copyArray(arr, skipHoles) {
  const result = [];
  const len = arr.length;
  for (let i = 0; i < len; i++) {
    if (Object.prototype.hasOwnProperty.call(arr, i)) {
      result.push(arr[i]);
    } else if (!skipHoles) {
      result.push(undefined);
    }
  }
  return result;
}

/**
 * Recursively flattens an array completely up to maxDepth.
 *
 * @param {any[]} array - The array to flatten.
 * @param {object} [options={}] - Configuration options.
 * @returns {any[]} Returns the new completely flattened array.
 */
export function flattenDeep(array, options = {}) {
  return flatten(array, Infinity, options);
}

export default flatten;
