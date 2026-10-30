/**
 * Safely creates a deep clone of a JavaScript value.
 * Handles nested objects, arrays, Date, RegExp, Map, Set,
 * preserves circular references using a WeakMap, and eliminates
 * prototype pollution vulnerabilities (__proto__, constructor, prototype).
 *
 * @template T
 * @param {T} val - The value to clone.
 * @param {WeakMap<object, any>} [seen=new WeakMap()] - Internal tracking for circular references.
 * @returns {T} The deeply cloned value.
 */
export function deepClone(val, seen = new WeakMap()) {
  if (val === null || typeof val !== 'object') {
    return val;
  }

  // Handle circular references
  if (seen.has(val)) {
    return seen.get(val);
  }

  // Handle Date
  if (val instanceof Date) {
    return new Date(val.getTime());
  }

  // Handle RegExp
  if (val instanceof RegExp) {
    return new RegExp(val.source, val.flags);
  }

  // Handle Map
  if (val instanceof Map) {
    const mapClone = new Map();
    seen.set(val, mapClone);
    for (const [k, v] of val.entries()) {
      mapClone.set(deepClone(k, seen), deepClone(v, seen));
    }
    return mapClone;
  }

  // Handle Set
  if (val instanceof Set) {
    const setClone = new Set();
    seen.set(val, setClone);
    for (const item of val.values()) {
      setClone.add(deepClone(item, seen));
    }
    return setClone;
  }

  // Handle Array
  if (Array.isArray(val)) {
    const arrClone = [];
    seen.set(val, arrClone);
    for (let i = 0; i < val.length; i++) {
      arrClone[i] = deepClone(val[i], seen);
    }
    return arrClone;
  }

  // Handle Object
  const objClone = Object.create(Object.getPrototypeOf(val));
  seen.set(val, objClone);

  const keys = Object.keys(val);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    // Defense against prototype pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    objClone[key] = deepClone(val[key], seen);
  }

  return objClone;
}

export default deepClone;
