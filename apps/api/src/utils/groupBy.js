const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function hasOwn(target, key) {
  return Object.prototype.hasOwnProperty.call(target, key);
}

function createContainer(nullPrototype) {
  return nullPrototype ? Object.create(null) : {};
}

function normalizeKey(rawKey) {
  if (typeof rawKey === "symbol") {
    return rawKey;
  }
  const stringKey = String(rawKey);
  return DANGEROUS_KEYS.has(stringKey) ? `$${stringKey}` : stringKey;
}

function resolveIteratee(iteratee) {
  if (iteratee == null) {
    return (item) => item;
  }
  if (typeof iteratee === "function") {
    return iteratee;
  }
  if (typeof iteratee === "string" || typeof iteratee === "symbol") {
    return (item) => (item == null ? undefined : item[iteratee]);
  }
  return (item) => item;
}

function assignToGroup(container, key, item) {
  if (hasOwn(container, key)) {
    container[key].push(item);
    return;
  }
  Object.defineProperty(container, key, {
    value: [item],
    writable: true,
    enumerable: true,
    configurable: true,
  });
}

export function groupBy(array, iteratee, options = {}) {
  const { nullPrototype = false, suppressErrors = false, onError } = options;

  if (!Array.isArray(array) || array.length === 0) {
    return createContainer(nullPrototype);
  }

  const container = createContainer(nullPrototype);
  const getKey = resolveIteratee(iteratee);

  for (let index = 0; index < array.length; index += 1) {
    if (!hasOwn(array, index)) {
      continue;
    }

    const item = array[index];
    let rawKey;

    try {
      rawKey = getKey(item, index, array);
    } catch (error) {
      const wrapped = new Error(`groupBy: iteratee failed at index ${index}`, { cause: error });

      if (typeof onError === "function") {
        rawKey = onError(error, item, index);
        if (rawKey === undefined) {
          continue;
        }
      } else if (suppressErrors) {
        continue;
      } else {
        throw wrapped;
      }
    }

    assignToGroup(container, normalizeKey(rawKey), item);
  }

  return container;
}
