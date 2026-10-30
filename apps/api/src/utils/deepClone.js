const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Defensive deep clone utility with prototype pollution protection and cycle handling.
 * @param {*} value The value to clone.
 * @param {object} [options] Optional configuration.
 * @param {boolean} [options.allowUnsafeKeys=false] Whether to permit dangerous keys (default: false).
 * @param {WeakMap} [seen] Internal tracker for cyclic references.
 * @returns {*} The cloned value.
 */
export function deepClone(value, options = {}, seen = new WeakMap()) {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (seen.has(value)) {
    return seen.get(value);
  }

  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags);
  }

  if (value instanceof Map) {
    const clonedMap = new Map();
    seen.set(value, clonedMap);
    for (const [k, v] of value.entries()) {
      clonedMap.set(deepClone(k, options, seen), deepClone(v, options, seen));
    }
    return clonedMap;
  }

  if (value instanceof Set) {
    const clonedSet = new Set();
    seen.set(value, clonedSet);
    for (const item of value.values()) {
      clonedSet.add(deepClone(item, options, seen));
    }
    return clonedSet;
  }

  if (Array.isArray(value)) {
    const clonedArr = [];
    seen.set(value, clonedArr);
    for (let i = 0; i < value.length; i++) {
      clonedArr.push(deepClone(value[i], options, seen));
    }
    return clonedArr;
  }

  if (ArrayBuffer.isView(value)) {
    if (value instanceof DataView) {
      return new DataView(value.buffer.slice(0), value.byteOffset, value.byteLength);
    }
    return new value.constructor(value);
  }

  const allowUnsafe = options.allowUnsafeKeys === true;
  const clonedObj = Object.create(Object.getPrototypeOf(value));
  seen.set(value, clonedObj);

  const keys = Reflect.ownKeys(value);
  for (const key of keys) {
    if (!allowUnsafe && typeof key === "string" && DANGEROUS_KEYS.has(key)) {
      continue;
    }
    const desc = Object.getOwnPropertyDescriptor(value, key);
    if (desc) {
      if (desc.value !== undefined) {
        clonedObj[key] = deepClone(desc.value, options, seen);
      } else {
        Object.defineProperty(clonedObj, key, desc);
      }
    }
  }

  return clonedObj;
}
