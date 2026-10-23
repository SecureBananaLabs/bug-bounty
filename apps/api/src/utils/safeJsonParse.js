const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Fault-tolerant, prototype-pollution-safe JSON parser (CWE-1321).
 *
 * @param {unknown} input - Raw JSON string to parse.
 * @param {any} [fallback=null] - Fallback value returned when parsing fails or input is invalid.
 * @param {object} [options] - Optional parser settings.
 * @param {number} [options.maxLength] - Maximum allowed input character length.
 * @param {function} [options.reviver] - Optional custom JSON reviver function.
 * @returns {any}
 */
export function safeJsonParse(input, fallback = null, options = {}) {
  if (typeof input !== "string") {
    return fallback;
  }

  const trimmed = input.trim();
  if (trimmed === "") {
    return fallback;
  }

  const { maxLength, reviver } = options ?? {};
  if (typeof maxLength === "number" && Number.isFinite(maxLength) && input.length > maxLength) {
    return fallback;
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
 * Fault-tolerant JSON serializer that handles circular references and BigInt values.
 *
 * @param {unknown} value - Value to serialize.
 * @param {string} [fallback="{}"] - Fallback string on failure.
 * @returns {string}
 */
export function safeJsonStringify(value, fallback = "{}") {
  const seen = new WeakSet();
  try {
    const result = JSON.stringify(value, (_key, val) => {
      if (typeof val === "bigint") {
        return val.toString();
      }
      if (typeof val === "object" && val !== null) {
        if (seen.has(val)) {
          return "[Circular]";
        }
        seen.add(val);
      }
      return val;
    });
    return typeof result === "string" ? result : fallback;
  } catch {
    return fallback;
  }
}
