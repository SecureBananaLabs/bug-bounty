import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  let query = req.query.q;

  // Validate: Reject non-string or repeated 'q' parameters
  if (Array.isArray(query)) {
    return res.status(400).json({ error: "Multiple 'q' parameters are not allowed." });
  }
  if (typeof query !== 'string' && typeof query !== 'undefined') {
    return res.status(400).json({ error: "Invalid 'q' parameter type. Must be a string." });
  }

  // Default to an empty string if 'q' is undefined
  query = query ?? "";

  // Trim whitespace
  query = query.trim();

  // Length-limit to 200 characters
  if (query.length > 200) {
    query = query.substring(0, 200);
  }

  // The query is now validated, trimmed, length-limited, and ensured to be a single string.
  // Further sanitization (e.g., character escaping) would typically be handled by the search service itself
  // or require specific instructions for the target search engine.

  return ok(res, await globalSearch(query));
}