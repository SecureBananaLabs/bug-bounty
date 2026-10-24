/**
 * Defensively validates canonical RFC 4122 UUID strings.
 * 
 * @param {string} input - The string to validate.
 * @param {1|4|5|'any'} [version='any'] - Optional specific UUID version to validate against (1, 4, 5, or 'any').
 * @returns {boolean} True if input is a valid UUID, false otherwise.
 */
const UUID_REGEX_ANY = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const UUID_REGEX_VERSION = {
  1: /^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  4: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  5: /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
};

export function isUUID(input, version = 'any') {
  if (typeof input !== 'string') {
    return false;
  }
  const trimmed = input.trim();
  if (trimmed.length !== 36) {
    return false;
  }

  const verStr = String(version).toLowerCase();
  if (verStr === 'any' || !UUID_REGEX_VERSION[verStr]) {
    return UUID_REGEX_ANY.test(trimmed);
  }

  return UUID_REGEX_VERSION[verStr].test(trimmed);
}

export default isUUID;
