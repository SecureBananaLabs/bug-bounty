const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const DEFAULT_MAX_DEPTH = 64;

function exceedsMaxDepth(str, maxDepth) {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < str.length; i += 1) {
    const ch = str[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      if (inString) escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (ch === "{" || ch === "[") {
        depth += 1;
        if (depth > maxDepth) {
          return true;
        }
      } else if (ch === "}" || ch === "]") {
        depth = Math.max(0, depth - 1);
      }
    }
  }
  return false;
}

/**
 * Fault-tolerant, prototype-pollution-safe JSON parser (CWE-1321).
 *
 * @param {unknown} input - Raw JSON string to parse.
 * @param {any} [fallback=null] - Fallback value returned when parsing fails or input is invalid.
 * @param {object} [options] - Optional parser settings.
 * @param {number} [options.maxLength] - Maximum allowed input character length.
 * @param {number} [options.maxDepth=64] - Maximum allowed structural nesting depth.
 * @param {function} [options.reviver] - Optional custom JSON reviver function.
 * @returns {any}
 */
export function safeJsonParse(input, fallback = null, options = {}) {
  if (typeof input !== "string") {
    return fallback;
  }

  const safeOptions = options !== null && typeof options === "object" ? options : {};
  const { maxLength, maxDepth = DEFAULT_MAX_DEPTH, reviver } = safeOptions;

  if (maxLength !== undefined) {
    if (typeof maxLength !== "number" || !Number.isFinite(maxLength) || maxLength < 0 || input.length > maxLength) {
      return fallback;
    }
  }

  const trimmed = input.trim();
  if (trimmed === "") {
    return fallback;
  }

  if (typeof maxDepth === "number" && Number.isFinite(maxDepth) && maxDepth >= 0) {
    if (exceedsMaxDepth(trimmed, maxDepth)) {
      return fallback;
    }
  }

  try {
    return JSON.parse(trimmed, function secureReviver(key, value) {
      if (FORBIDDEN_KEYS.has(key)) {
        return undefined;
      }
      return typeof reviver === "function" ? reviver.call(this, key, value) : value;
    });
  } catch {
    return fallback;
  }
}

/**
 * Fault-tolerant JSON serializer that handles circular references (without corrupting shared DAG objects) and BigInt values.
 *
 * @param {unknown} value - Value to serialize.
 * @param {string} [fallback="{}"] - Fallback string on failure.
 * @returns {string}
 */
export function safeJsonStringify(value, fallback = "{}") {
  const ancestors = [];
  try {
    const result = JSON.stringify(value, function circularSafeReplacer(_key, val) {
      if (typeof val === "bigint") {
        return val.toString();
      }
      if (typeof val === "object" && val !== null) {
        while (ancestors.length > 0 && ancestors[ancestors.length - 1] !== this) {
          ancestors.pop();
        }
        if (ancestors.includes(val)) {
          return "[Circular]";
        }
        ancestors.push(val);
      }
      return val;
    });
    return typeof result === "string" ? result : fallback;
  } catch {
    return fallback;
  }
}
