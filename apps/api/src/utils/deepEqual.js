/**
 * Deep recursive equality comparison utility.
 * Defensively compares primitives, objects, arrays, Dates, RegExps, Maps, Sets,
 * and handles circular structures without stack overflow.
 *
 * @param {any} a - First value
 * @param {any} b - Second value
 * @param {WeakMap<object, object>} [visited=new WeakMap()] - Circular reference tracking map
 * @returns {boolean} True if deeply equal, false otherwise
 */
export function deepEqual(a, b, visited = new WeakMap()) {
  // Same reference or identical primitive (handles NaN === NaN correctly via Object.is)
  if (Object.is(a, b)) {
    return true;
  }

  // If either is null or not an object/function, they cannot be equal
  if (a === null || typeof a !== 'object' || b === null || typeof b !== 'object') {
    return false;
  }

  // Must share identical prototype / constructor
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) {
    return false;
  }

  // Handle circular references
  if (visited.has(a)) {
    return visited.get(a) === b;
  }
  visited.set(a, b);

  // Date comparison
  if (a instanceof Date) {
    const match = a.getTime() === b.getTime();
    if (!match) visited.delete(a);
    return match;
  }

  // RegExp comparison
  if (a instanceof RegExp) {
    const match = a.source === b.source && a.flags === b.flags;
    if (!match) visited.delete(a);
    return match;
  }

  // Array comparison
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) {
      visited.delete(a);
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i], visited)) {
        visited.delete(a);
        return false;
      }
    }
    return true;
  }

  // Map comparison
  if (a instanceof Map) {
    if (!(b instanceof Map) || a.size !== b.size) {
      visited.delete(a);
      return false;
    }
    for (const [key, val] of a.entries()) {
      if (!b.has(key) || !deepEqual(val, b.get(key), visited)) {
        visited.delete(a);
        return false;
      }
    }
    return true;
  }

  // Set comparison
  if (a instanceof Set) {
    if (!(b instanceof Set) || a.size !== b.size) {
      visited.delete(a);
      return false;
    }
    const matchedIndices = new Set();
    const bValues = Array.from(b.values());
    for (const valA of a.values()) {
      let foundIndex = -1;
      for (let i = 0; i < bValues.length; i++) {
        if (!matchedIndices.has(i) && deepEqual(valA, bValues[i], visited)) {
          foundIndex = i;
          break;
        }
      }
      if (foundIndex === -1) {
        visited.delete(a);
        return false;
      }
      matchedIndices.add(foundIndex);
    }
    return true;
  }

  // Plain objects
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) {
    visited.delete(a);
    return false;
  }

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key) || !deepEqual(a[key], b[key], visited)) {
      visited.delete(a);
      return false;
    }
  }

  return true;
}
