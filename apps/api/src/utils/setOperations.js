/**
 * High-performance, defensive set operations (difference, intersection, union, symmetricDifference)
 * with O(N) lookup efficiency, sparse array hole defense, custom iteratee exception shielding,
 * and strict type validation.
 *
 * Implements defenses against:
 * - CWE-400: Uncontrolled resource consumption via O(N) Set hashing instead of O(N*M) scans
 * - CWE-1321 / Prototype pollution: Sparse array own-property validation preventing prototype traversal
 * - CWE-755: Custom iteratee exception shielding with strict mode rethrow
 * - CWE-1287: Improper type input fallback vs strict type checking
 * - Array size bounds: Configurable maxElements protection against memory exhaustion
 */

function applyIteratee(fn, item, strict) {
  if (typeof fn !== 'function') return item;
  try {
    return fn(item);
  } catch (err) {
    if (strict) throw err;
    return item;
  }
}

function extractElements(arr, strict, skipHoles, maxElements) {
  if (!Array.isArray(arr)) {
    if (strict) {
      throw new TypeError(`[setOperations] Expected array, received ${arr === null ? 'null' : typeof arr}`);
    }
    return [];
  }

  if (arr.length > maxElements) {
    if (strict) {
      throw new RangeError(`[setOperations] Array length ${arr.length} exceeds maxElements limit ${maxElements}`);
    }
  }

  const elements = [];
  const len = Math.min(arr.length, maxElements);
  for (let i = 0; i < len; i++) {
    const isOwn = Object.prototype.hasOwnProperty.call(arr, i);
    if (!isOwn) {
      if (skipHoles) {
        continue;
      }
      elements.push(undefined);
    } else {
      elements.push(arr[i]);
    }
  }
  return elements;
}

function normalizeArgs(iteratee, options) {
  let actualIteratee = iteratee;
  let actualOptions = options;

  if (typeof iteratee === 'object' && iteratee !== null) {
    actualOptions = iteratee;
    actualIteratee = undefined;
  }

  const {
    strict = false,
    skipHoles = true,
    maxElements = 500000,
    unique = true
  } = actualOptions || {};

  if (actualIteratee !== undefined && typeof actualIteratee !== 'function') {
    if (strict) {
      throw new TypeError(`[setOperations] Expected iteratee to be a function, received ${typeof actualIteratee}`);
    }
    actualIteratee = undefined;
  }

  return { actualIteratee, strict, skipHoles, maxElements, unique };
}

/**
 * Returns the elements of `array` that are not included in `values`.
 *
 * @template T
 * @param {T[]} array - The base array to inspect.
 * @param {any[]} values - The values to exclude.
 * @param {((item: any) => any)|object} [iteratee] - Iteratee invoked per element, or options object.
 * @param {object} [options={}] - Configuration options.
 * @param {boolean} [options.strict=false] - Throw on invalid inputs or iteratee errors.
 * @param {boolean} [options.skipHoles=true] - Skip unassigned holes in sparse arrays.
 * @param {number} [options.maxElements=500000] - Maximum array elements allowed.
 * @param {boolean} [options.unique=true] - Deduplicate output elements.
 * @returns {T[]} Returns the array of filtered values.
 */
export function difference(array, values, iteratee, options = {}) {
  const { actualIteratee, strict, skipHoles, maxElements, unique } = normalizeArgs(iteratee, options);

  const baseItems = extractElements(array, strict, skipHoles, maxElements);
  const excludeItems = extractElements(values, strict, skipHoles, maxElements);

  const excludeSet = new Set();
  for (const item of excludeItems) {
    excludeSet.add(applyIteratee(actualIteratee, item, strict));
  }

  const result = [];
  const seenComputed = unique ? new Set() : null;

  for (const item of baseItems) {
    const computed = applyIteratee(actualIteratee, item, strict);
    if (!excludeSet.has(computed)) {
      if (seenComputed) {
        if (!seenComputed.has(computed)) {
          seenComputed.add(computed);
          result.push(item);
        }
      } else {
        result.push(item);
      }
    }
  }

  return result;
}

/**
 * Returns the elements of `array` that are also included in `values`.
 *
 * @template T
 * @param {T[]} array - The base array to inspect.
 * @param {any[]} values - The values to match.
 * @param {((item: any) => any)|object} [iteratee] - Iteratee invoked per element, or options object.
 * @param {object} [options={}] - Configuration options.
 * @param {boolean} [options.strict=false] - Throw on invalid inputs or iteratee errors.
 * @param {boolean} [options.skipHoles=true] - Skip unassigned holes in sparse arrays.
 * @param {number} [options.maxElements=500000] - Maximum array elements allowed.
 * @param {boolean} [options.unique=true] - Deduplicate output elements.
 * @returns {T[]} Returns the array of intersecting values.
 */
export function intersection(array, values, iteratee, options = {}) {
  const { actualIteratee, strict, skipHoles, maxElements, unique } = normalizeArgs(iteratee, options);

  const baseItems = extractElements(array, strict, skipHoles, maxElements);
  const matchItems = extractElements(values, strict, skipHoles, maxElements);

  const matchSet = new Set();
  for (const item of matchItems) {
    matchSet.add(applyIteratee(actualIteratee, item, strict));
  }

  const result = [];
  const seenComputed = unique ? new Set() : null;

  for (const item of baseItems) {
    const computed = applyIteratee(actualIteratee, item, strict);
    if (matchSet.has(computed)) {
      if (seenComputed) {
        if (!seenComputed.has(computed)) {
          seenComputed.add(computed);
          result.push(item);
        }
      } else {
        result.push(item);
      }
    }
  }

  return result;
}

/**
 * Creates an array of unique values, in order, from all given arrays.
 *
 * @template T
 * @param {T[]} array - The primary array.
 * @param {any[]} values - The secondary array.
 * @param {((item: any) => any)|object} [iteratee] - Iteratee invoked per element, or options object.
 * @param {object} [options={}] - Configuration options.
 * @returns {T[]} Returns the union array.
 */
export function union(array, values, iteratee, options = {}) {
  const { actualIteratee, strict, skipHoles, maxElements } = normalizeArgs(iteratee, options);

  const items1 = extractElements(array, strict, skipHoles, maxElements);
  const items2 = extractElements(values, strict, skipHoles, maxElements);

  const result = [];
  const seenComputed = new Set();

  for (const item of items1.concat(items2)) {
    const computed = applyIteratee(actualIteratee, item, strict);
    if (!seenComputed.has(computed)) {
      seenComputed.add(computed);
      result.push(item);
    }
  }

  return result;
}

/**
 * Returns the elements of the symmetric difference (elements in either array, but not in both).
 *
 * @template T
 * @param {T[]} array - The first array.
 * @param {any[]} values - The second array.
 * @param {((item: any) => any)|object} [iteratee] - Iteratee invoked per element, or options object.
 * @param {object} [options={}] - Configuration options.
 * @returns {T[]} Returns the symmetric difference array.
 */
export function symmetricDifference(array, values, iteratee, options = {}) {
  const { actualIteratee, strict, skipHoles, maxElements, unique } = normalizeArgs(iteratee, options);

  const diff1 = difference(array, values, actualIteratee, { strict, skipHoles, maxElements, unique });
  const diff2 = difference(values, array, actualIteratee, { strict, skipHoles, maxElements, unique });

  return union(diff1, diff2, actualIteratee, { strict, skipHoles, maxElements });
}

export default {
  difference,
  intersection,
  union,
  symmetricDifference
};
