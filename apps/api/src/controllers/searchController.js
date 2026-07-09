const searchService = require('../services/searchService');

const MAX_QUERY_LENGTH = 200;

/**
 * GET /api/search
 * Validates and trims the search query before passing to globalSearch.
 */
async function search(req, res, next) {
  try {
    const rawQuery = req.query.q;

    // Reject non-string or repeated query parameters
    if (rawQuery !== undefined && typeof rawQuery !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" must be a string.' });
    }

    // Trim whitespace
    const trimmedQuery = (rawQuery || '').trim();

    // Reject over-long queries
    if (trimmedQuery.length > MAX_QUERY_LENGTH) {
      return res.status(400).json({ error: `Query parameter "q" must be at most ${MAX_QUERY_LENGTH} characters.` });
    }

    const results = await searchService.globalSearch(trimmedQuery);
    res.json(results);
  } catch (err) {
    next(err);
  }
}

module.exports = { search };
