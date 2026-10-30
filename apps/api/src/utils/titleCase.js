/**
 * Safely converts strings to standard English Title Case.
 * Capitalizes first letter of significant words while preserving minor articles and prepositions in lowercase,
 * unless they appear as the first or last word.
 * 
 * @param {string} input - Raw text string.
 * @returns {string} Title-cased string.
 */
const MINOR_WORDS = new Set([
  'a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'in', 'of', 'with'
]);

export function toTitleCase(input) {
  if (typeof input !== 'string') {
    return '';
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return '';
  }

  // Split on whitespace while preserving words
  const words = trimmed.split(/\s+/);
  const total = words.length;

  const result = words.map((word, index) => {
    // Handle hyphenated sub-words (e.g. "full-stack")
    if (word.includes('-')) {
      const parts = word.split('-');
      const partCount = parts.length;
      return parts
        .map((subWord, subIdx) => {
          if (!subWord) return '';
          const lower = subWord.toLowerCase();
          if ((index === 0 && subIdx === 0) || (index === total - 1 && subIdx === partCount - 1)) {
            return lower.charAt(0).toUpperCase() + lower.slice(1);
          }
          if (MINOR_WORDS.has(lower)) {
            return lower;
          }
          return lower.charAt(0).toUpperCase() + lower.slice(1);
        })
        .join('-');
    }

    const lower = word.toLowerCase();
    // First and last words are always capitalized
    if (index === 0 || index === total - 1) {
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    }

    // Minor words remain lowercase
    if (MINOR_WORDS.has(lower)) {
      return lower;
    }

    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });

  return result.join(' ');
}

export default toTitleCase;
