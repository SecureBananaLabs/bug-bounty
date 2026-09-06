const searchService = require('../services/searchService');

const MAX_QUERY_LENGTH = 200;

/**
 * Search for jobs, users, etc.
 * Expects req.query.q as the search query string.
 */
async function search(req, res, next) {
  try {
    let query = req.query.q;

    // Validate that query is a string
    if (query !== undefined && typeof query !== 'string') {
      const error = new Error('Invalid search query: must be a string');
      error.status = 400;
      throw error;
    }

    // Trim whitespace
    if (query) {
      query = query.trim();
    }

    // Enforce maximum length
    if (query && query.length > MAX_QUERY_LENGTH) {
      const error = new Error(`Search query must be ${MAX_QUERY_LENGTH} characters or less`);
      error.status = 400;
      throw error;
    }

    // If query is empty after trimming, return empty results
    if (!query) {
      return res.json({ results: [] });
    }

    const results = await searchService.search(query);
    res.json({ results });
  } catch (err) {
    next(err);
  }
}

module.exports = { search };
