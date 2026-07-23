const { searchService } = require('../services/searchService');
const { validateSearchQuery } = require('../utils/validation');

async function search(req, res, next) {
  try {
    const query = req.query.q;

    // Validate and sanitize the search query
    const validatedQuery = validateSearchQuery(query);

    // Pass the validated query to the search service
    const results = await searchService.search(validatedQuery);
    res.json(results);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  search,
};