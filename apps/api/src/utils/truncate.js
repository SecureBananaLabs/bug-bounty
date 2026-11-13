/**
 * Production-grade unicode and word-boundary safe string truncation utility.
 * Supports customizable omission indicators, regex/string separators,
 * middle-truncation for Web3 addresses and tx hashes, and surrogate-pair safety.
 *
 * @param {*} input - String or value to truncate.
 * @param {number} [length=30] - Maximum target length in code points.
 * @param {Object} [options={}] - Configuration options.
 * @param {string} [options.omission='...'] - Truncation omission indicator.
 * @param {string|RegExp} [options.separator] - Word boundary separator to preserve whole words.
 * @param {boolean} [options.middle=false] - If true, truncates in the middle (ideal for Web3 hashes).
 * @returns {string} Truncated string.
 */
export function truncate(input, length = 30, options = {}) {
  // 1. Safe input coercion
  if (input === null || input === undefined) {
    return '';
  }
  const str = typeof input === 'string' ? input : String(input);

  // 2. Validate length
  if (typeof length !== 'number' || isNaN(length) || length <= 0) {
    return '';
  }

  const omission = options.omission !== undefined ? String(options.omission) : '...';
  const omissionChars = Array.from(omission);
  const chars = Array.from(str);

  // 3. If within length bounds, return as is
  if (chars.length <= length) {
    return str;
  }

  // 4. If length is smaller than or equal to omission length
  if (length <= omissionChars.length) {
    return omissionChars.slice(0, length).join('');
  }

  // 5. Middle truncation mode (for Web3 addresses & hashes)
  if (options.middle) {
    const available = length - omissionChars.length;
    const leftCount = Math.ceil(available / 2);
    const rightCount = Math.floor(available / 2);
    const leftPart = chars.slice(0, leftCount).join('');
    const rightPart = rightCount > 0 ? chars.slice(chars.length - rightCount).join('') : '';
    return leftPart + omission + rightPart;
  }

  // 6. End truncation mode
  const targetLen = length - omissionChars.length;
  let subChars = chars.slice(0, targetLen);
  let subStr = subChars.join('');

  // 7. Word-boundary separator preservation
  if (options.separator) {
    const sep = options.separator;
    if (typeof sep === 'string') {
      const lastIndex = subStr.lastIndexOf(sep);
      if (lastIndex > 0) {
        subStr = subStr.slice(0, lastIndex);
      }
    } else if (sep instanceof RegExp) {
      // Create a global copy of the regex to find all matches within the substring
      const flags = sep.flags.includes('g') ? sep.flags : sep.flags + 'g';
      const re = new RegExp(sep.source, flags);
      let match;
      let lastMatchIndex = -1;
      while ((match = re.exec(subStr)) !== null) {
        lastMatchIndex = match.index;
      }
      if (lastMatchIndex > 0) {
        subStr = subStr.slice(0, lastMatchIndex);
      }
    }
  }

  return subStr + omission;
}

export default truncate;
