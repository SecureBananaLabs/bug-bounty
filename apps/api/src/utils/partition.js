/**
 * Splits a collection into two arrays: the first containing elements for which
 * the predicate returns truthy, and the second containing elements for which it returns falsy.
 *
 * @param {Array|Iterable|Object} collection - The collection to iterate over.
 * @param {Function} [predicate=Boolean] - The function invoked per iteration (item, key/index, collection) => boolean.
 * @returns {[Array, Array]} A tuple of two arrays: [truthyElements, falsyElements].
 */
export function partition(collection, predicate = Boolean) {
  if (collection == null) {
    return [[], []];
  }

  const fn = typeof predicate === 'function' ? predicate : (item) => Boolean(item);
  const pass = [];
  const fail = [];

  if (Array.isArray(collection)) {
    for (let i = 0; i < collection.length; i++) {
      const item = collection[i];
      if (fn(item, i, collection)) {
        pass.push(item);
      } else {
        fail.push(item);
      }
    }
    return [pass, fail];
  }

  if (collection instanceof Set || collection instanceof Map) {
    let index = 0;
    for (const entry of collection.entries()) {
      const item = collection instanceof Set ? entry[0] : entry;
      if (fn(item, index++, collection)) {
        pass.push(item);
      } else {
        fail.push(item);
      }
    }
    return [pass, fail];
  }

  if (typeof collection === 'object') {
    const keys = Object.keys(collection);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = collection[key];
      if (fn(value, key, collection)) {
        pass.push(value);
      } else {
        fail.push(value);
      }
    }
    return [pass, fail];
  }

  return [[], []];
}
