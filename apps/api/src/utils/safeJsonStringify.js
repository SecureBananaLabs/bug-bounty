/**
 * Safely serializes a JavaScript value to a JSON string.
 * Defensively handles circular references using a WeakSet, serializes BigInt
 * values as strings, and gracefully returns a fallback string on error or undefined output.
 *
 * @param {*} val - The value to serialize to JSON.
 * @param {string} [fallback="{}"] - The fallback string returned on error or undefined.
 * @returns {string} Serialized JSON string or fallback.
 */
export function safeJsonStringify(val, fallback = "{}") {
  try {
    const seen = new WeakSet();

    const result = JSON.stringify(val, (key, value) => {
      // Convert BigInt to string to avoid TypeError
      if (typeof value === 'bigint') {
        return value.toString();
      }

      // Detect and handle circular references
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }

      return value;
    });

    if (result === undefined) {
      return fallback;
    }

    return result;
  } catch {
    return fallback;
  }
}

export default safeJsonStringify;
