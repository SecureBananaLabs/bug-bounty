/**
 * Safely strips HTML tags and decodes common HTML entities.
 * Defensively handles non-string inputs, malformed tags, and script injection.
 * 
 * @param {string} input - The input string containing HTML.
 * @returns {string} Clean plain-text string.
 */
const ENTITY_MAP = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' '
};

export function stripHtml(input) {
  if (typeof input !== 'string') {
    return '';
  }
  if (!input.trim()) {
    return '';
  }

  // Remove script and style elements along with their contents
  let clean = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Strip all HTML/XML tags
  clean = clean.replace(/<[^>]*>?/gm, '');

  // Decode common HTML entities
  clean = clean.replace(/&(?:amp|lt|gt|quot|apos|nbsp|#39);/gi, (match) => {
    return ENTITY_MAP[match.toLowerCase()] || match;
  });

  return clean.trim();
}

export default stripHtml;
