/**
 * Production-ready URL-safe slug generator.
 * Trims input, converts casing, strips accents/diacritics using NFKD normalization,
 * replaces whitespace and underscores with the specified separator, filters non-alphanumeric
 * characters, and collapses/trims separators.
 *
 * @param {string} str - String to convert to URL slug.
 * @param {Object} [options={}] - Configuration options.
 * @param {string} [options.separator='-'] - Separator to use between words.
 * @param {boolean} [options.lowercase=true] - Whether to convert result to lowercase.
 * @param {number} [options.maxLength] - Optional maximum allowable length.
 * @returns {string} Clean URL slug, or '' for invalid/non-string inputs.
 */
export function slugify(str, options = {}) {
  if (typeof str !== 'string') {
    return '';
  }

  const {
    separator = '-',
    lowercase = true,
    maxLength
  } = (options && typeof options === 'object') ? options : {};

  const sep = typeof separator === 'string' && separator.length > 0 ? separator : '-';
  const escapedSep = sep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const charClassChars = Array.from(new Set(sep))
    .map(c => c.replace(/[-\\^\]]/g, '\\$&'))
    .join('');

  // 1. Normalize accents and diacritics using NFKD
  let result = str.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

  // 2. Case conversion
  if (lowercase) {
    result = result.toLowerCase();
  }

  // 3. Trim whitespace
  result = result.trim();

  // 4. Replace spaces, tabs, newlines, and underscores with the separator
  result = result.replace(/[\s_]+/g, sep);

  // 5. Remove non-alphanumeric characters except the characters forming the separator
  const nonAlphaNumRegex = new RegExp(`[^a-zA-Z0-9${charClassChars}]`, 'g');
  result = result.replace(nonAlphaNumRegex, '');

  // 6. Collapse consecutive separators using non-capturing group
  const collapseRegex = new RegExp(`(?:${escapedSep})+`, 'g');
  result = result.replace(collapseRegex, sep);

  // 7. Strip leading and trailing separators
  const trimRegex = new RegExp(`^(?:${escapedSep})+|(?:${escapedSep})+$`, 'g');
  result = result.replace(trimRegex, '');

  // 8. Optional length truncation without dangling trailing separator
  if (typeof maxLength === 'number' && Number.isFinite(maxLength)) {
    const limit = Math.floor(maxLength);
    if (limit <= 0) {
      return '';
    }
    if (result.length > limit) {
      result = result.slice(0, limit).replace(new RegExp(`(?:${escapedSep})+$`), '');
    }
  }

  return result;
}

export default slugify;
