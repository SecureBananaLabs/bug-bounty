import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

function validateSearchQuery(query) {
  if (typeof query !== 'string') return '';
  // Trim whitespace and limit length to 200 characters
  let sanitized = query.trim();
  if (sanitized.length > 200) sanitized = sanitized.substring(0, 200);
  return sanitized;
}

export async function search(req, res) {
  const sanitizedQuery = validateSearchQuery(req.query.q);
  return ok(res, await globalSearch(sanitizedQuery));
}
