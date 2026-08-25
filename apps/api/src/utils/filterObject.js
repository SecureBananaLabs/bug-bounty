/**
 * Prototype-safe object filtering utilities.
 * Prevents prototype pollution by creating objects with null prototype.
 * @module utils/filterObject
 */

/**
 * Creates an object composed of the properties the predicate returns truthy for.
 * The predicate is invoked with three arguments: (value, key, object).
 * Returns a new object with null prototype to prevent prototype pollution.
 *
 * @param {Object} object - The source object to filter.
 * @param {Function} predicate - The function invoked per iteration.
 * @returns {Object} Returns the new filtered object.
 * @example
 * pickBy({ a: 1, b: '2', c: 3 }, (v) => typeof v === 'number');
 * // => { a: 1, c: 3 }
 */
function pickBy(object, predicate) {
  if (object == null || typeof object !== 'object') {
    return Object.create(null);
  }

  if (typeof predicate !== 'function') {
    throw new TypeError('Expected predicate to be a function');
  }

  const result = Object.create(null);
  const keys = Object.keys(object);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = object[key];
    if (predicate(value, key, object)) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Creates an object composed of the properties the predicate returns falsy for.
 * The predicate is invoked with three arguments: (value, key, object).
 * Returns a new object with null prototype to prevent prototype pollution.
 *
 * @param {Object} object - The source object to filter.
 * @param {Function} predicate - The function invoked per iteration.
 * @returns {Object} Returns the new filtered object.
 * @example
 * omitBy({ a: 1, b: '2', c: 3 }, (v) => typeof v === 'number');
 * // => { b: '2' }
 */
function omitBy(object, predicate) {
  if (object == null || typeof object !== 'object') {
    return Object.create(null);
  }

  if (typeof predicate !== 'function') {
    throw new TypeError('Expected predicate to be a function');
  }

  const result = Object.create(null);
  const keys = Object.keys(object);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = object[key];
    if (!predicate(value, key, object)) {
      result[key] = value;
    }
  }

  return result;
}

module.exports = {
  pickBy,
  omitBy,
};
