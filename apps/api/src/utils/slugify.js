/**
 * @file slugify.js
 * Deterministic URL slug generator with unicode accent normalization and symbol sanitization.
 */

'use strict';

/**
 * Transforms an arbitrary text string into a clean, URL-safe slug.
 *
 * @param {string} text - The input text to slugify.
 * @param {Object} [options]
 * @param {boolean} [options.lower=true] - Whether to lowercase the output.
 * @param {string} [options.separator='-'] - Separator character between words.
 * @param {boolean} [options.trim=true] - Whether to trim leading/trailing separators.
 * @returns {string} The formatted URL slug.
 */
export function slugify(text, options = {}) {
  if (text == null) {
    return '';
  }

  const str = String(text);
  if (!str.trim()) {
    return '';
  }

  const lower = options.lower !== false;
  const separator = typeof options.separator === 'string' && options.separator.length > 0 ? options.separator : '-';
  const trim = options.trim !== false;

  // 1. Normalize unicode diacritics (e.g. "é" -> "e", "ñ" -> "n")
  let normalized = str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (lower) {
    normalized = normalized.toLowerCase();
  }

  // 2. Replace non-alphanumeric characters with the separator
  // Escape separator if it contains regex special characters
  const escapedSep = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const nonWordRegex = new RegExp(`[^a-zA-Z0-9${escapedSep}]+`, 'g');
  normalized = normalized.replace(nonWordRegex, separator);

  // 3. Collapse multiple consecutive separators
  const multiSepRegex = new RegExp(`${escapedSep}{2,}`, 'g');
  normalized = normalized.replace(multiSepRegex, separator);

  // 4. Trim leading and trailing separators if requested
  if (trim) {
    const trimRegex = new RegExp(`^${escapedSep}+|${escapedSep}+$`, 'g');
    normalized = normalized.replace(trimRegex, '');
  }

  return normalized;
}
