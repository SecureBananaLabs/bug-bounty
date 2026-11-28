const BLOCKED_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function parsePath(path) {
  if (Array.isArray(path)) return path;
  if (typeof path !== "string") return [];
  return path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter((segment) => segment.length > 0);
}

function getFromMap(map, rawSegment, segment) {
  if (map.has(rawSegment)) return { found: true, value: map.get(rawSegment) };
  if (map.has(segment)) return { found: true, value: map.get(segment) };
  if (/^\d+$/.test(segment) && map.has(Number(segment))) {
    return { found: true, value: map.get(Number(segment)) };
  }
  return { found: false };
}

export function safeGet(target, path, defaultValue) {
  const segments = parsePath(path);
  if (segments.length === 0) return defaultValue;

  let current = target;

  for (const rawSegment of segments) {
    const segment = String(rawSegment);

    if (BLOCKED_KEYS.has(segment)) {
      return defaultValue;
    }

    if (current === null || current === undefined) {
      return defaultValue;
    }

    if (typeof current !== "object") {
      return defaultValue;
    }

    if (current instanceof Map) {
      const result = getFromMap(current, rawSegment, segment);
      if (!result.found) return defaultValue;
      current = result.value;
    } else {
      if (!Object.prototype.hasOwnProperty.call(current, segment)) {
        return defaultValue;
      }
      current = current[segment];
    }
  }

  return current === undefined ? defaultValue : current;
}
