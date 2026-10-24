/**
 * Production-ready string truncation utility with Unicode character boundary preservation.
 * Defensively handles non-string inputs, invalid or non-positive bounds, and custom suffixes.
 *
 * @param {string} str - String to truncate.
 * @param {number} maxLength - Maximum allowable length of the result in Unicode code points.
 * @param {string} [suffix='...'] - Custom suffix appended when truncation occurs.
 * @returns {string} Truncated string, original string if within bounds, or '' if invalid.
 */
export function truncateString(str, maxLength, suffix = '...') {
  if (typeof str !== 'string') {
    return '';
  }

  if (typeof maxLength !== 'number' || isNaN(maxLength) || maxLength <= 0) {
    return '';
  }

  const chars = Array.from(str);
  if (chars.length <= maxLength) {
    return str;
  }

  const safeSuffix = typeof suffix === 'string' ? suffix : String(suffix ?? '');
  const suffixChars = Array.from(safeSuffix);

  if (maxLength <= suffixChars.length) {
    return suffixChars.slice(0, maxLength).join('');
  }

  const targetLength = maxLength - suffixChars.length;
  return chars.slice(0, targetLength).join('') + safeSuffix;
}

export default truncateString;
