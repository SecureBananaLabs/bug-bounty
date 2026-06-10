import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

function validateSearchQuery(query) {
  if (typeof query !== 'string') {
    const error = new Error('Search query must be a string');
    error.status = 400;
    throw error;
  }
  
  const trimmedQuery = query.trim();
  
  if (trimmedQuery.length === 0) {
    return '';
  }
  
  if (trimmedQuery.length > 200) {
    return trimmedQuery.substring(0, 200);
  }
  return trimmedQuery;
}
export async function search(req, res) {
  const validatedQuery = validateSearchQuery(req.query.q ?? "");
  return ok(res, await globalSearch(validatedQuery));
}
