/**
 * Converts arbitrary text into a safe, normalized URL slug.
 * @param {string} text - Input text
 * @param {object} [options]
 * @param {number} [options.maxLength=80] - Max character length
 * @param {string} [options.separator='-'] - Word separator character
 * @returns {string} URL-safe slug
 */
export function slugify(text, options = {}) {
  if (!text || typeof text !== 'string') return '';

  const maxLength = typeof options.maxLength === 'number' && options.maxLength > 0 ? options.maxLength : 80;
  const separator = typeof options.separator === 'string' && options.separator.length === 1 ? options.separator : '-';

  const slug = text
    .normalize('NFD') // Decompose diacritics
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-_]/g, '') // Remove non-alphanumeric except space/separator
    .replace(/[\s-_]+/g, separator) // Replace consecutive spaces/separators with single separator
    .replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), ''); // Trim leading/trailing separators

  return slug.slice(0, maxLength).replace(new RegExp(`${separator}+$`, 'g'), '');
}
