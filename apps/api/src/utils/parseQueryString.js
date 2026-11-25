const BLOCKED_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const NUMERIC_PATTERN = /^-?\d+(\.\d+)?$/;

function safeDecode(segment) {
  if (segment === "") return "";
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function coerceValue(value, { parseBooleans, parseNumbers }) {
  if (parseBooleans) {
    if (value === "true") return true;
    if (value === "false") return false;
  }

  if (parseNumbers && NUMERIC_PATTERN.test(value)) {
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }

  return value;
}

export function parseQueryString(queryString, options = {}) {
  const { parseBooleans = false, parseNumbers = false } = options;
  const result = {};

  if (typeof queryString !== "string") return result;

  const stripped = queryString.replace(/^[?#]+/, "");
  if (stripped === "") return result;

  for (const pair of stripped.split("&")) {
    if (pair === "") continue;

    const eqIndex = pair.indexOf("=");
    const rawKey = eqIndex === -1 ? pair : pair.slice(0, eqIndex);
    const rawValue = eqIndex === -1 ? null : pair.slice(eqIndex + 1);

    const key = safeDecode(rawKey);
    if (key === "" || BLOCKED_KEYS.has(key)) continue;

    const value = rawValue === null ? true : coerceValue(safeDecode(rawValue), { parseBooleans, parseNumbers });

    if (Object.prototype.hasOwnProperty.call(result, key)) {
      const existing = result[key];
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        result[key] = [existing, value];
      }
    } else {
      result[key] = value;
    }
  }

  return result;
}
