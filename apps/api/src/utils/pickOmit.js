const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function isDangerousKey(key) {
  return typeof key === "string" && DANGEROUS_KEYS.has(key);
}

// Throws for dangerAction: "throw", otherwise reports the key as unsafe to copy.
function isSafeKey(key, dangerAction) {
  if (!isDangerousKey(key)) return true;
  if (dangerAction === "throw") {
    throw new Error(`pickOmit: refusing to process dangerous key "${key}"`);
  }
  return false;
}

function isPickable(value) {
  return value !== null && (typeof value === "object" || typeof value === "function");
}

function toKeyList(keys) {
  if (keys === null || keys === undefined) return [];
  if (typeof keys === "string" || typeof keys === "symbol") return [keys];
  if (typeof keys[Symbol.iterator] === "function") return [...keys];
  return [keys];
}

function createResult(nullPrototype) {
  return nullPrototype ? Object.create(null) : {};
}

export function pick(obj, keys, options = {}) {
  const { dangerAction = "skip", nullPrototype = false } = options ?? {};
  const result = createResult(nullPrototype);
  if (!isPickable(obj)) return result;

  for (const key of toKeyList(keys)) {
    if (!isSafeKey(key, dangerAction)) continue;
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key];
    }
  }
  return result;
}

export function omit(obj, keys, options = {}) {
  const { dangerAction = "skip", nullPrototype = false } = options ?? {};
  const result = createResult(nullPrototype);
  if (!isPickable(obj)) return result;

  const excludeSet = new Set(toKeyList(keys));
  for (const key of Reflect.ownKeys(obj)) {
    if (excludeSet.has(key)) continue;
    if (!isSafeKey(key, dangerAction)) continue;
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key];
    }
  }
  return result;
}

export function pickBy(obj, predicate, options = {}) {
  const { dangerAction = "skip", nullPrototype = false } = options ?? {};
  const result = createResult(nullPrototype);
  if (!isPickable(obj)) return result;

  for (const key of Reflect.ownKeys(obj)) {
    if (!isSafeKey(key, dangerAction)) continue;
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const value = obj[key];
    if (predicate(value, key, obj)) {
      result[key] = value;
    }
  }
  return result;
}

export function omitBy(obj, predicate, options = {}) {
  const { dangerAction = "skip", nullPrototype = false } = options ?? {};
  const result = createResult(nullPrototype);
  if (!isPickable(obj)) return result;

  for (const key of Reflect.ownKeys(obj)) {
    if (!isSafeKey(key, dangerAction)) continue;
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const value = obj[key];
    if (!predicate(value, key, obj)) {
      result[key] = value;
    }
  }
  return result;
}
