/**
 * Defensive string manipulation utilities for FreelanceFlow.
 * Handles null/undefined inputs, ReDoS-safe regex escaping, and length clamping.
 */

/**
 * Truncates a string to a specified maximum length, appending a suffix if truncated.
 * Guarantees that the returned string never exceeds `maxLength`.
 *
 * @param {string|null|undefined} input - The string to truncate.
 * @param {number} maxLength - Maximum allowable length of the returned string.
 * @param {string} [suffix="..."] - Suffix to append when truncated.
 * @returns {string} Truncated string, or empty string if input is null/undefined.
 */
export function truncate(input, maxLength, suffix = "...") {
  if (input === null || input === undefined) {
    return "";
  }

  const str = String(input);
  const max = Math.max(0, Math.floor(Number(maxLength) || 0));

  if (max === 0) {
    return "";
  }

  if (str.length <= max) {
    return str;
  }

  const suf = String(suffix ?? "");

  if (suf.length >= max) {
    return suf.slice(0, max);
  }

  return str.slice(0, max - suf.length) + suf;
}

/**
 * Converts a string into a clean, URL-safe and filesystem-safe slug.
 * Removes diacritics/accents, replaces spaces and special characters with separators.
 *
 * @param {string|null|undefined} input - Input text to slugify.
 * @param {object} [options={}] - Custom configuration.
 * @param {boolean} [options.lower=true] - Convert to lowercase.
 * @param {string} [options.separator="-"] - Word separator character.
 * @param {number} [options.maxLength] - Maximum length of the generated slug.
 * @param {boolean} [options.strict=true] - Strip non-alphanumeric characters.
 * @returns {string} Safe slug string.
 */
export function slugify(input, options = {}) {
  if (input === null || input === undefined) {
    return "";
  }

  const {
    lower = true,
    separator = "-",
    maxLength,
    strict = true
  } = options;

  let str = String(input).trim();
  if (!str) {
    return "";
  }

  // Normalize Unicode to decompose diacritics (NFKD) and strip combining accents
  str = str.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");

  if (lower) {
    str = str.toLowerCase();
  }

  const sep = String(separator ?? "-");
  const escapedSep = sep.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  if (strict) {
    // Replace non-alphanumeric characters with separator
    str = str.replace(/[^a-zA-Z0-9]+/g, sep);
  } else {
    // Replace whitespace and common punctuation with separator
    str = str.replace(/[\s\-_]+/g, sep);
  }

  // Collapse consecutive separators
  if (sep) {
    const collapseRegex = new RegExp(`${escapedSep}+`, "g");
    str = str.replace(collapseRegex, sep);

    // Trim separators from start and end
    const trimRegex = new RegExp(`^${escapedSep}+|${escapedSep}+$`, "g");
    str = str.replace(trimRegex, "");
  }

  // Apply maximum length clamping if provided
  if (typeof maxLength === "number" && maxLength > 0) {
    const max = Math.floor(maxLength);
    if (str.length > max) {
      str = str.slice(0, max);
      if (sep) {
        const trailingRegex = new RegExp(`${escapedSep}+$`, "g");
        str = str.replace(trailingRegex, "");
      }
    }
  }

  return str;
}

/**
 * Safely escapes characters that have special meaning in Regular Expressions.
 * Prevents Regular Expression Denial of Service (ReDoS) and syntax errors.
 *
 * @param {string|null|undefined} input - The string to escape.
 * @returns {string} Safe regex-escaped string.
 */
export function escapeRegex(input) {
  if (input === null || input === undefined) {
    return "";
  }

  return String(input).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Sanitizes plain text input by stripping HTML tags, removing non-printable control
 * characters (null bytes, bell, etc.) and normalizing line breaks.
 *
 * @param {string|null|undefined} input - The raw text to sanitize.
 * @param {object} [options={}] - Custom configuration options.
 * @param {boolean} [options.trim=true] - Trim whitespace around the string.
 * @param {boolean} [options.allowNewlines=true] - Allow line breaks (\n).
 * @param {boolean} [options.collapseWhitespace=false] - Collapse consecutive spaces into one.
 * @param {number} [options.maxLength] - Maximum length clamp.
 * @returns {string} Sanitized plain text string.
 */
export function sanitizePlainText(input, options = {}) {
  if (input === null || input === undefined) {
    return "";
  }

  const {
    trim = true,
    allowNewlines = true,
    collapseWhitespace = false,
    maxLength
  } = options;

  let str = String(input);

  // Strip null bytes and dangerous control characters (keep \t, \n, \r)
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Strip HTML / XML tags defensively without ReDoS vulnerability
  str = str.replace(/<[^>]*>/g, "");

  // Normalize line breaks
  str = str.replace(/\r\n|\r/g, "\n");

  if (!allowNewlines) {
    str = str.replace(/\n+/g, " ");
  }

  if (collapseWhitespace) {
    str = str.replace(/[^\S\r\n]+/g, " ");
  }

  if (trim) {
    str = str.trim();
  }

  if (typeof maxLength === "number" && maxLength >= 0) {
    const max = Math.floor(maxLength);
    str = str.slice(0, max);
  }

  return str;
}
