/**
 * Safely escapes regular expression special characters to prevent ReDoS and regex injection.
 * 
 * @param {string} input - User input string to be escaped.
 * @returns {string} Escaped string safe for new RegExp().
 */
const REGEX_SPECIAL_CHARS = /[\\^$.*+?()[\]{}|/-]/g;

export function escapeRegex(input) {
  if (typeof input !== 'string') {
    return '';
  }
  return input.replace(REGEX_SPECIAL_CHARS, '\\$&');
}

export default escapeRegex;
