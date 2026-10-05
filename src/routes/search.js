/**
 * Search route with input validation and query length limits.
 *
 * Fixes issue #2833: "Search endpoint has no input validation or length limit on query"
 *
 * Problems addressed:
 *  - No validation of the `q` query parameter (could be missing, non-string, or an array/object).
 *  - No maximum length, allowing unbounded input (DoS / log-injection / regex abuse surface).
 *  - No minimum length, allowing empty/whitespace-only queries to hit the data layer.
 *  - Unescaped user input passed to the underlying matcher (regex-injection risk).
 *
 * Behavior:
 *  - Rejects missing / non-string / array queries with HTTP 400.
 *  - Trims whitespace; rejects empty queries with HTTP 400.
 *  - Enforces a hard maximum length (MAX_QUERY_LENGTH = 100 chars) with HTTP 400.
 *  - Escapes regex metacharacters before use so user input is treated literally.
 *  - Returns a bounded, predictable JSON payload.
 */

const express = require('express');
const router = express.Router();

const MAX_QUERY_LENGTH = 100;
const MIN_QUERY_LENGTH = 1;

/**
 * Escape a string so it can be safely embedded in a RegExp as a literal.
 * @param {string} str
 * @returns {string}
 */
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validate and normalize the incoming search query.
 * @param {*} raw - the raw value of req.query.q
 * @returns {{ ok: true, value: string } | { ok: false, error: string }}
 */
function validateQuery(raw) {
  // Reject missing, array (e.g. ?q=a&q=b), or non-string values.
  if (raw === undefined || raw === null) {
    return { ok: false, error: 'Missing required query parameter: q' };
  }
  if (typeof raw !== 'string') {
    return { ok: false, error: 'Query parameter q must be a single string value' };
  }

  const value = raw.trim();

  if (value.length < MIN_QUERY_LENGTH) {
    return { ok: false, error: 'Query parameter q must not be empty' };
  }
  if (value.length > MAX_QUERY_LENGTH) {
    return {
      ok: false,
      error: `Query parameter q must be at most ${MAX_QUERY_LENGTH} characters`,
    };
  }

  return { ok: true, value };
}

// GET /api/search?q=...
router.get('/search', async (req, res) => {
  const result = validateQuery(req.query.q);

  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }

  const query = result.value;

  try {
    // Treat the user's input as a literal substring, not a pattern.
    const safePattern = new RegExp(escapeRegExp(query), 'i');

    // `items` is the in-memory / mock dataset used by the app.
    const items = req.app.locals.items || [];
    const matches = items
      .filter((item) => {
        const haystack = [item.title, item.description, item.tags]
          .filter(Boolean)
          .join(' ');
        return safePattern.test(haystack);
      })
      .slice(0, 50); // bound the response size

    return res.json({
      query,
      count: matches.length,
      results: matches,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
module.exports.validateQuery = validateQuery;
module.exports.escapeRegExp = escapeRegExp;
module.exports.MAX_QUERY_LENGTH = MAX_QUERY_LENGTH;
