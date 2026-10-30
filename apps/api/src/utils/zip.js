/**
 * Defensive array pairing and unbundling utilities (zip, unzip, zipWith, unzipWith)
 * with sparse array hole protection, non-array fallback, length normalization,
 * and denial-of-service bounds protection.
 *
 * Implements defenses against:
 * - CWE-400: Uncontrolled resource consumption via bounded max elements cap
 * - CWE-1321: Prototype pollution leakage via own-property hole checks
 * - CWE-1287: Improper input type fallback (non-arrays safely normalized to [])
 * - CWE-755: Iteratee exception handling and safe propagation
 */

const MAX_SAFE_LENGTH = 100000;

/**
 * Normalizes input into a safe array. If not an array, attempts iterable extraction
 * or falls back to an empty array.
 *
 * @param {any} val - The input to normalize.
 * @returns {any[]} Returns normalized array.
 */
function toSafeArray(val) {
  if (Array.isArray(val)) {
    return val;
  }
  if (val != null && typeof val[Symbol.iterator] === 'function' && typeof val !== 'string') {
    try {
      return Array.from(val);
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Safely extracts an element from an array index, verifying own-property existence
 * to prevent prototype pollution attributes on Array.prototype from leaking into holes.
 *
 * @param {any[]} arr - The target array.
 * @param {number} idx - Index to retrieve.
 * @returns {any} Element value or undefined.
 */
function getSafeElement(arr, idx) {
  if (idx < arr.length && Object.prototype.hasOwnProperty.call(arr, idx)) {
    return arr[idx];
  }
  return undefined;
}

/**
 * Creates an array of grouped elements, the first of which contains the first elements
 * of the given arrays, the second of which contains the second elements of the given arrays,
 * and so on.
 *
 * @param {...any[]} arrays - The arrays to process.
 * @returns {any[][]} Returns the new array of grouped elements.
 */
export function zip(...arrays) {
  if (arrays.length === 0) {
    return [];
  }

  const safeArrays = arrays.map(toSafeArray);

  let maxLength = 0;
  for (const arr of safeArrays) {
    if (arr.length > maxLength) {
      maxLength = arr.length;
    }
  }

  const normalizedLength = Math.min(maxLength, MAX_SAFE_LENGTH);
  const result = new Array(normalizedLength);

  for (let i = 0; i < normalizedLength; i++) {
    const group = new Array(safeArrays.length);
    for (let j = 0; j < safeArrays.length; j++) {
      group[j] = getSafeElement(safeArrays[j], i);
    }
    result[i] = group;
  }

  return result;
}

/**
 * Inverse of `zip`. Accepts an array of grouped elements and creates an array
 * regroups elements into original arrays.
 *
 * @param {any[][]} array - The array of grouped elements to process.
 * @returns {any[][]} Returns the new array of regrouped elements.
 */
export function unzip(array) {
  if (!Array.isArray(array) || array.length === 0) {
    return [];
  }

  const safeRows = array.map(toSafeArray);

  let maxLength = 0;
  for (const row of safeRows) {
    if (row.length > maxLength) {
      maxLength = row.length;
    }
  }

  const normalizedLength = Math.min(maxLength, MAX_SAFE_LENGTH);
  const result = new Array(normalizedLength);

  for (let i = 0; i < normalizedLength; i++) {
    const group = new Array(safeRows.length);
    for (let j = 0; j < safeRows.length; j++) {
      group[j] = getSafeElement(safeRows[j], i);
    }
    result[i] = group;
  }

  return result;
}

/**
 * Like `zip`, except that it accepts an iteratee to specify how grouped values
 * should be combined. Supports both Lodash trailing iteratee syntax `zipWith(...arrays, iteratee)`
 * and FP leading iteratee syntax `zipWith(iteratee, ...arrays)`.
 *
 * @param {...any} args - The iteratees and arrays.
 * @returns {any[]} Returns the new array of grouped values.
 */
export function zipWith(...args) {
  if (args.length === 0) {
    throw new TypeError('[zipWith] Expected at least an iteratee function');
  }

  let iteratee;
  let arrays;

  if (typeof args[0] === 'function') {
    iteratee = args[0];
    arrays = args.slice(1);
  } else if (typeof args[args.length - 1] === 'function') {
    iteratee = args[args.length - 1];
    arrays = args.slice(0, -1);
  } else {
    throw new TypeError(`[zipWith] Expected iteratee to be a function, received ${args[0] === null ? 'null' : typeof args[0]}`);
  }

  const zipped = zip(...arrays);
  return zipped.map((group) => iteratee(...group));
}

/**
 * Like `unzip`, except that it accepts an iteratee to specify how regrouped values
 * should be combined. Supports both `unzipWith(array, iteratee)` and `unzipWith(iteratee, array)`.
 *
 * @param {any} array - The array of grouped elements or iteratee function.
 * @param {any} iteratee - The iteratee function or array.
 * @returns {any[]} Returns the new array of regrouped values.
 */
export function unzipWith(array, iteratee) {
  let arr = array;
  let fn = iteratee;

  if (typeof arr === 'function' && (Array.isArray(fn) || fn == null)) {
    arr = fn;
    fn = array;
  }

  if (typeof fn !== 'function') {
    throw new TypeError(`[unzipWith] Expected iteratee to be a function, received ${fn === null ? 'null' : typeof fn}`);
  }

  const unzipped = unzip(arr);
  return unzipped.map((group) => fn(...group));
}

zip.zip = zip;
zip.unzip = unzip;
zip.zipWith = zipWith;
zip.unzipWith = unzipWith;

export default Object.assign(zip, {
  zip,
  unzip,
  zipWith,
  unzipWith
});
