import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

function validateSearchQuery(query) {
  if (!query) return "";
  
  // Trim whitespace and limit length to prevent DoS
  const sanitized = query.trim();
  if (sanitized.length > 200) {
    throw new Error("Search query too long");
  }
  return sanitized;
}

export async function search(req, res) {
  const validatedQuery = validateSearchQuery(req.query.q);
  return ok(res, await globalSearch(validatedQuery));
}
