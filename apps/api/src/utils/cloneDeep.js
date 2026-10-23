/**
 * Industrial-grade prototype-pollution resistant deep cloning utility.
 * Supports primitives, nested objects, arrays, Dates, RegExps, Maps, Sets,
 * Object.create(null) dictionaries, and circular reference graphs.
 *
 * @param {*} value - The value to deeply clone.
 * @param {WeakMap} [seen=new WeakMap()] - Internal cache to handle circular references.
 * @returns {*} Deeply cloned duplicate of input value.
 */
export function cloneDeep(value, seen = new WeakMap()) {
  // 1. Primitives & function references (immutable or non-clonable)
  if (value === null || typeof value !== 'object') {
    return value;
  }

  // 2. Circular reference resolution
  if (seen.has(value)) {
    return seen.get(value);
  }

  // 3. Handle Date objects
  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  // 4. Handle RegExp objects
  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags);
  }

  // 5. Handle Map objects
  if (value instanceof Map) {
    const clonedMap = new Map();
    seen.set(value, clonedMap);
    for (const [k, v] of value.entries()) {
      clonedMap.set(cloneDeep(k, seen), cloneDeep(v, seen));
    }
    return clonedMap;
  }

  // 6. Handle Set objects
  if (value instanceof Set) {
    const clonedSet = new Set();
    seen.set(value, clonedSet);
    for (const v of value.values()) {
      clonedSet.add(cloneDeep(v, seen));
    }
    return clonedSet;
  }

  // 7. Handle Arrays
  if (Array.isArray(value)) {
    const clonedArray = [];
    seen.set(value, clonedArray);
    for (let i = 0; i < value.length; i++) {
      if (i in value) {
        clonedArray[i] = cloneDeep(value[i], seen);
      }
    }
    return clonedArray;
  }

  // 8. Handle Plain Objects & Object.create(null)
  const proto = Object.getPrototypeOf(value);
  const isNullProto = proto === null;

  const clonedObj = isNullProto ? Object.create(null) : {};
  seen.set(value, clonedObj);

  // Retrieve all own property keys including symbols
  const keys = Reflect.ownKeys(value);
  for (const key of keys) {
    // Strictly block prototype pollution vectors
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }

    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor && 'value' in descriptor) {
      Object.defineProperty(clonedObj, key, {
        value: cloneDeep(descriptor.value, seen),
        writable: descriptor.writable,
        enumerable: descriptor.enumerable,
        configurable: descriptor.configurable
      });
    } else if (descriptor) {
      Object.defineProperty(clonedObj, key, descriptor);
    }
  }

  return clonedObj;
}

export default cloneDeep;
