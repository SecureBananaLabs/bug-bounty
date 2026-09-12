/**
 * @file search.js
 * Search query parameter validation enforcing trimmed string bounds (2 to 100 characters).
 */

'use strict';

/**
 * Validates whether a search query string satisfies length bounds (2 to 100 chars).
 *
 * @param {string} query
 * @returns {boolean}
 */
export function isValidSearchQuery(query) {
  if (!query || typeof query !== 'string') {
    return false;
  }
  const trimmed = query.trim();
  return trimmed.length >= 2 && trimmed.length <= 100;
}

/**
 * Validates a search query parameter string.
 *
 * @param {string|any} query - The raw search query parameter (req.query.q).
 * @returns {{ valid: boolean, error?: string, data?: { q: string } }}
 */
export function validateSearchQuery(query) {
  if (!isValidSearchQuery(query)) {
    return {
      valid: false,
      error: "Search query 'q' must be at least 2 characters",
    };
  }

  return {
    valid: true,
    data: {
      q: String(query).trim(),
    },
  };
}
