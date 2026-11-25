const DEFAULT_MAX_DEPTH = 1000;
const CIRCULAR_MODES = new Set(["preserve", "skip", "throw"]);

function hasOwnIndex(array, index) {
  return Object.prototype.hasOwnProperty.call(array, index);
}

function toSafeInteger(value, fallback) {
  if (value === Infinity) return Infinity;
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.floor(num);
}

function flattenInto(array, depth, options, ancestors, result) {
  const { onCircular, skipHoles } = options;
  ancestors.add(array);

  for (let i = 0; i < array.length; i += 1) {
    if (!hasOwnIndex(array, i)) {
      if (!skipHoles) result.push(undefined);
      continue;
    }

    const value = array[i];

    if (!Array.isArray(value)) {
      result.push(value);
      continue;
    }

    if (ancestors.has(value)) {
      if (onCircular === "throw") {
        throw new Error("flatten: circular reference detected in array input");
      }
      if (onCircular === "skip") continue;
      result.push(value);
      continue;
    }

    if (depth <= 0) {
      result.push(value);
      continue;
    }

    flattenInto(value, depth - 1, options, ancestors, result);
  }

  ancestors.delete(array);
  return result;
}

export function flatten(array, depth = 1, options = {}) {
  const {
    strict = false,
    maxDepth = DEFAULT_MAX_DEPTH,
    onCircular = "preserve",
    skipHoles = false,
  } = options;

  if (!Array.isArray(array)) {
    if (strict) {
      throw new TypeError("flatten: expected an array");
    }
    return [];
  }

  if (!CIRCULAR_MODES.has(onCircular)) {
    throw new TypeError(`flatten: invalid onCircular option "${onCircular}"`);
  }

  const safeMaxDepth = Math.max(0, toSafeInteger(maxDepth, DEFAULT_MAX_DEPTH));
  const requestedDepth = toSafeInteger(depth, 1);
  const cappedDepth = safeMaxDepth === Infinity ? requestedDepth : Math.min(requestedDepth, safeMaxDepth);
  const effectiveDepth = Math.max(0, cappedDepth);

  return flattenInto(array, effectiveDepth, { onCircular, skipHoles }, new WeakSet(), []);
}

export function flattenDeep(array, options = {}) {
  return flatten(array, Infinity, options);
}
