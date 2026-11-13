/**
 * Defensively validates whether a string contains only alphanumeric characters (a-z, A-Z, 0-9),
 * with configurable options for allowing spaces, dashes, and underscores.
 *
 * @param {string} str - The string to validate.
 * @param {Object} [options={}] - Validation configuration options.
 * @param {boolean} [options.allowSpaces=false] - Whether ASCII spaces (' ') are allowed.
 * @param {boolean} [options.allowDashes=false] - Whether ASCII dashes ('-') are allowed.
 * @param {boolean} [options.allowUnderscores=false] - Whether ASCII underscores ('_') are allowed.
 * @returns {boolean} True if the string consists solely of allowed alphanumeric characters, false otherwise.
 */
export function isAlphanumeric(str, options = {}) {
  if (typeof str !== 'string' || str.length === 0) {
    return false;
  }

  const opts = options && typeof options === 'object' ? options : {};
  const {
    allowSpaces = false,
    allowDashes = false,
    allowUnderscores = false
  } = opts;

  let pattern = '^[a-zA-Z0-9';
  if (allowSpaces) pattern += ' ';
  if (allowDashes) pattern += '\\-';
  if (allowUnderscores) pattern += '_';
  pattern += ']+$';

  const regex = new RegExp(pattern);
  return regex.test(str);
}

export default isAlphanumeric;
