function isFreezable(value) {
  return value !== null && typeof value === "object";
}

function blockMutation(target, methodName, typeName) {
  Object.defineProperty(target, methodName, {
    value() {
      throw new TypeError(`Cannot call ${methodName}() on a frozen ${typeName}`);
    },
    writable: false,
    configurable: false,
    enumerable: false,
  });
}

function freezeMap(map, seen) {
  for (const [key, value] of map.entries()) {
    deepFreeze(key, seen);
    deepFreeze(value, seen);
  }

  for (const methodName of ["set", "delete", "clear"]) {
    blockMutation(map, methodName, "Map");
  }
}

function freezeSet(set, seen) {
  for (const item of set.values()) {
    deepFreeze(item, seen);
  }

  for (const methodName of ["add", "delete", "clear"]) {
    blockMutation(set, methodName, "Set");
  }
}

function freezeObjectGraph(obj, seen) {
  const descriptors = Object.getOwnPropertyDescriptors(obj);
  for (const key of Reflect.ownKeys(descriptors)) {
    const descriptor = descriptors[key];
    // Accessor properties are left alone: invoking the getter to inspect its
    // value could trigger side effects or return a different value each call.
    if (Object.hasOwn(descriptor, "value")) {
      deepFreeze(descriptor.value, seen);
    }
  }
}

export function deepFreeze(obj, seen = new WeakSet()) {
  if (!isFreezable(obj) || seen.has(obj)) {
    return obj;
  }
  seen.add(obj);

  if (obj instanceof Map) {
    freezeMap(obj, seen);
  } else if (obj instanceof Set) {
    freezeSet(obj, seen);
  } else {
    freezeObjectGraph(obj, seen);
  }

  return Object.freeze(obj);
}
