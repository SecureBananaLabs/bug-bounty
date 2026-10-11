let counter = 0;

/**
 * Generate a unique entity ID with a monotonic counter suffix
 * to prevent collisions when multiple entities are created within
 * the same millisecond (Date.now() is not unique at high concurrency).
 */
export function generateId(prefix) {
  return `${prefix}_${Date.now()}_${++counter}`;
}
