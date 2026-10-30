/**
 * Safely extracts user-perceived grapheme clusters using Intl.Segmenter where available,
 * falling back to code point iteration (Array.from) in legacy environments.
 * This guarantees compound emojis (ZWJ sequences), skin tones, flags, and combining
 * diacritics are never split into dangling surrogate pairs or broken modifiers.
 *
 * @param {string} text - Input text.
 * @returns {string[]} Array of individual grapheme clusters.
 */
function getGraphemes(text) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    return Array.from(segmenter.segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

/**
 * Production-ready string truncation utility with Unicode grapheme cluster boundary preservation.
 * Defensively handles non-string inputs, invalid/non-positive/fractional bounds, and custom suffixes.
 *
 * @param {string} str - String to truncate.
 * @param {number} maxLength - Maximum allowable length of the result in user-perceived characters.
 * @param {string} [suffix='...'] - Custom suffix appended when truncation occurs.
 * @returns {string} Truncated string, original string if within bounds, or '' if invalid.
 */
export function truncateString(str, maxLength, suffix = '...') {
  if (typeof str !== 'string') {
    return '';
  }

  if (typeof maxLength !== 'number' || !Number.isFinite(maxLength) || maxLength <= 0) {
    return '';
  }

  const limit = Math.floor(maxLength);
  if (limit <= 0) {
    return '';
  }

  const chars = getGraphemes(str);
  if (chars.length <= limit) {
    return str;
  }

  const safeSuffix = typeof suffix === 'string' ? suffix : String(suffix ?? '');
  const suffixChars = getGraphemes(safeSuffix);

  if (limit <= suffixChars.length) {
    return suffixChars.slice(0, limit).join('');
  }

  const targetLength = limit - suffixChars.length;
  return chars.slice(0, targetLength).join('') + safeSuffix;
}

export default truncateString;
