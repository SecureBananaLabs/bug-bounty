/**
 * Recursively freezes an object and its nested properties, defending against
 * circular references via WeakSet and securing Map and Set instances against mutation.
 *
 * @template T
 * @param {T} obj - The target object, collection, or primitive to freeze
 * @param {WeakSet<object>} [seen=new WeakSet()] - Internal cache to track visited objects and prevent infinite recursion
 * @returns {T} The deeply frozen object
 */
export function deepFreeze(obj, seen = new WeakSet()) {
  // Primitives and null cannot and need not be frozen
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return obj;
  }

  // Prevent infinite loops on circular references
  if (seen.has(obj)) {
    return obj;
  }

  seen.add(obj);

  // Defend Map instances: recursively freeze keys and values, and neutralize mutation methods
  if (obj instanceof Map) {
    for (const [key, value] of obj.entries()) {
      deepFreeze(key, seen);
      deepFreeze(value, seen);
    }

    Object.defineProperty(obj, 'set', {
      value: function() {
        throw new TypeError('Cannot set key in frozen Map');
      },
      configurable: false,
      writable: false,
    });
    Object.defineProperty(obj, 'delete', {
      value: function() {
        throw new TypeError('Cannot delete key in frozen Map');
      },
      configurable: false,
      writable: false,
    });
    Object.defineProperty(obj, 'clear', {
      value: function() {
        throw new TypeError('Cannot clear frozen Map');
      },
      configurable: false,
      writable: false,
    });
  }

  // Defend Set instances: recursively freeze items, and neutralize mutation methods
  if (obj instanceof Set) {
    for (const item of obj.values()) {
      deepFreeze(item, seen);
    }

    Object.defineProperty(obj, 'add', {
      value: function() {
        throw new TypeError('Cannot add item to frozen Set');
      },
      configurable: false,
      writable: false,
    });
    Object.defineProperty(obj, 'delete', {
      value: function() {
        throw new TypeError('Cannot delete item from frozen Set');
      },
      configurable: false,
      writable: false,
    });
    Object.defineProperty(obj, 'clear', {
      value: function() {
        throw new TypeError('Cannot clear frozen Set');
      },
      configurable: false,
      writable: false,
    });
  }

  // Traverse all own property keys (including Symbols and non-enumerable properties)
  const propNames = Reflect.ownKeys(obj);
  for (const name of propNames) {
    const desc = Object.getOwnPropertyDescriptor(obj, name);
    if (desc && Object.prototype.hasOwnProperty.call(desc, 'value')) {
      deepFreeze(desc.value, seen);
    }
  }

  return Object.freeze(obj);
}

export default deepFreeze;
