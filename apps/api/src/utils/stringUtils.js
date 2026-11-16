/**
 * Defensive stringUtils utility
 * Provides truncate, slugify, and escapeRegex helpers.
 * Ref: #13893, #743
 */

const DISALLOWED_CHARS_RE = /[\x00-\x1f\x7f]/g;

/**
 * Truncate a string to maxLength, appending ellipsis if truncated.
 * @param {string} str
 * @param {number} maxLength
 * @param {string} [ellipsis='...']
 * @returns {string}
 */
export function truncate(str, maxLength, ellipsis = "...") {
  if (typeof str !== "string") return "";
  if (maxLength < 0) maxLength = 0;
  // Remove control characters first
  str = str.replace(DISALLOWED_CHARS_RE, "");
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Convert string to URL-safe slug (lowercase, alphanumeric + hyphens).
 * Strips control characters and normalizes whitespace.
 * @param {string} str
 * @param {string} [separator='-']
 * @returns {string}
 */
export function slugify(str, separator = "-") {
  if (typeof str !== "string") return "";
  // Strip control characters
  str = str.replace(DISALLOWED_CHARS_RE, "");
  // Lowercase, replace non-alphanumeric with separator, collapse multiple separators
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, separator)
    .replace(new RegExp(`^${separator}+|${separator}+$`, "g"), "");
}

/**
 * Escape special regex characters in a string for safe use in RegExp().
 * @param {string} str
 * @returns {string}
 */
export function escapeRegex(str) {
  if (typeof str !== "string") return "";
  // Escape all regex metacharacters: \ ^ $ . | ? * + ( ) [ ] { }
  return str.replace(/[\\^$.*|?+()[\]{}]/g, "\\$&");
}
