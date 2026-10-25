const users = [];
let userCounter = 0;

// Fields that should never be stored or returned
const BLOCKED_FIELDS = new Set([
  'password', 'passwordHash', 'token', 'resetToken',
  'secret', 'apiKey', 'privateKey', 'credential',
]);

/**
 * Generate a unique user ID, safe for same-millisecond calls.
 */
function generateUserId() {
  userCounter++;
  return `usr_${Date.now()}_${userCounter}`;
}

/**
 * Remove blocked credential fields from an object.
 * @param {Object} obj
 * @returns {Object} Cleaned copy (does not mutate original)
 */
function sanitize(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!BLOCKED_FIELDS.has(key)) {
      result[key] = value;
    }
  }
  return result;
}

/** @internal Test-only: clear all stored users */
export function _reset() {
  users.length = 0;
}

export async function listUsers() {
  // Return sanitized copies — no credential fields leaked
  return users.map(sanitize);
}

export async function createUser(payload = {}) {
  const user = {
    ...sanitize(payload),
    id: generateUserId(),
  };
  users.push(user);
  return sanitize(user); // response also sanitized
}
