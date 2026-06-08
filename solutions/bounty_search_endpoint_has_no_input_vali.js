// apps/api/src/controllers/searchController.js
const searchService = require('../services/searchService');

/**
 * Validate and sanitize search query.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
async function searchController(req, res, next) {
  try {
    // Get raw query parameter q
    const rawQ = req.query.q;

    // Reject if q is not provided
    if (rawQ === undefined) {
      return res.status(400).json({ error: 'Search query parameter "q" is required' });
    }

    // Reject if q is an array (e.g., repeated ?q=foo&q=bar)
    if (Array.isArray(rawQ)) {
      return res.status(400).json({ error: 'Multiple query values for "q" are not allowed' });
    }

    // Ensure q is a string
    if (typeof rawQ !== 'string') {
      return res.status(400).json({ error: 'Search query must be a string' });
    }

    // Trim whitespace
    let q = rawQ.trim();

    // Enforce maximum length
    const MAX_LENGTH = 200;
    if (q.length > MAX_LENGTH) {
      return res.status(400).json({ error: `Search query must not exceed ${MAX_LENGTH} characters` });
    }

    // Attach validated query to request for downstream use
    req.validatedQuery = q;

    // Call the search service
    const results = await searchService.search(q);
    res.json(results);
  } catch (err) {
    next(err);
  }
}

module.exports = { searchController };

// Simple test/example usage
if (require.main === module) {
  // Mock Express req/res objects
  const mockReq = { query: { q: '  test query  ' } };
  const mockRes = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.body = data;
      return this;
    }
  };
  const mockNext = (err) => { if (err) console.error(err); };

  // Mock searchService
  const mockSearchService = {
    search: async (q) => ({ query: q, results: ['result1', 'result2'] })
  };

  // Test controller with mocked service
  async function runTest() {
    // Temporarily replace the searchService used inside the controller
    const originalSearchService = searchService;
    // eslint-disable-next-line no-global-assign
    searchService = mockSearchService;

    await searchController(mockReq, mockRes, mockNext);
    console.log('Test response:', mockRes.body);

    // Restore original
    // eslint-disable-next-line no-global