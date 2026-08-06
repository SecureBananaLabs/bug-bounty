import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";
import createError from "http-errors";

// Utility function for input validation and sanitization
function validateAndSanitizeQuery(query) {
  if (typeof query !== 'string') {
    throw createError(400, 'Query must be a string');
  }
  const trimmedQuery = query.trim();
  if (trimmedQuery.length > 200) {
    throw createError(400, 'Query too long. Maximum 200 characters allowed.');
  }
  return trimmedQuery;
}

export async function search(req, res) {
  try {
    const sanitizedQuery = validateAndSanitizeQuery(req.query.q ?? "");
    return ok(res, await globalSearch(sanitizedQuery));
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
}
