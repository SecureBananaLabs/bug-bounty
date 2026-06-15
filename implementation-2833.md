# Implementation for #2833

See issue #2833 for details.

## Bug: Missing Input Validation on Search Query

Description: The `GET /api/search` endpoint passes `req.query.q` directly to the search service without validation or length limits. An attacker can send extremely long query strings or repeated query parameters to consume resources or trigger unexpected search-service inputs.

File: `apps/api/src/controllers/searchController.js`

Expected behavior: The search query should be validated, trimmed, length-limited to 200 characters, and sanitized bef