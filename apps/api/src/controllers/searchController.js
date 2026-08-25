const searchService = require('../services/searchService');
const { validateSearchQuery } = require('../validators/search');

async function search(req, res, next) {
  try {
    const { q, type, page = 1, limit = 20 } = req.query;
    const results = await searchService.search(q, type, parseInt(page), parseInt(limit));
    res.json(results);
  } catch (err) {
    next(err);
  }
}

module.exports = { search, validateSearchQuery };
