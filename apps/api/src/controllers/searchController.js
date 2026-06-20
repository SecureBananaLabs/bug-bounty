const searchService = require('../services/searchService');

/**
 * GET /api/search
 * Search for jobs, users, or other entities.
 * Query parameter: q (string, required, max 200 chars)
 */
async function search(req, res, next) {
  try {
    let query = req.query.q;

    // Validate that q is provided and is a string
    if (query === undefined || query === null) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    if (typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" must be a string' });
    }

    // Trim whitespace
    query = query.trim();

    // Length limit to 200 characters
    if (query.length > 200) {
      return res.status(400).json({ error: 'Query parameter "q" must be at most 200 characters' });
    }

    // Basic sanitization: remove any non-printable characters
    query = query.replace(/[^\x20-\x7E]/g, '');

    // If after sanitization the query is empty, return early
    if (query.length === 0) {
      return res.status(400).json({ error: 'Query parameter "q" must not be empty after sanitization' });
    }

    const results = await searchService.search(query);
    res.json(results);
  } catch (err) {
    next(err);
  }
}

module.exports = { search };
