/**
 * Deterministically converts text into a clean, URL-safe slug.
 * - Normalizes unicode accents / diacritics via NFD decomposition
 * - Removes invalid URI characters
 * - Converts to lowercase by default
 * - Collapses consecutive whitespace and separator characters
 * - Trims leading and trailing separators
 *
 * @param {string} text - Input text to slugify
 * @param {object} [options={}] - Custom configuration
 * @param {string} [options.separator='-'] - Separator character (default: '-')
 * @param {boolean} [options.lowercase=true] - Whether to lowercase the output
 * @returns {string} - Clean URL slug
 */
export function slugify(text, options = {}) {
  if (text === null || text === undefined) {
    return "";
  }

  const str = String(text);
  const separator = typeof options.separator === "string" ? options.separator : "-";
  const lowercase = options.lowercase !== false;

  // 1. Unicode NFD normalization to separate base characters from diacritical marks
  let slug = str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // 2. Case conversion
  if (lowercase) {
    slug = slug.toLowerCase();
  }

  // 3. Strip quotation marks and apostrophes to preserve contractions (e.g. what's -> whats)
  slug = slug.replace(/['"`’‘“”]/g, "");

  // 4. Replace non-alphanumeric characters (excluding separators/whitespace) with whitespace
  slug = slug.replace(/[^a-zA-Z0-9\s_-]/g, " ");

  // 4. Replace whitespace, underscores, and hyphens with the designated separator
  const sepRegex = new RegExp(`[\\s_-]+`, "g");
  slug = slug.replace(sepRegex, separator);

  // 5. Trim leading and trailing separators
  const escapedSep = separator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const trimRegex = new RegExp(`^${escapedSep}+|${escapedSep}+$`, "g");
  slug = slug.replace(trimRegex, "");

  return slug;
}
