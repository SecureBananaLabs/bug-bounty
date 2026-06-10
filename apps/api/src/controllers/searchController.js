import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

function validateSearchQuery(query) {
  if (typeof query !== 'string') {
    throw new Error('Search query must be a string');
  }
  
  const trimmedQuery = query.trim();
  
  if (trimmedQuery.length > 200) {
    throw new Error('Search query must be less than 200 characters');
  }
  
  return trimmedQuery;
}

export async function search(req, res) {
  const searchQuery = req.query.q ?? "";
  const validatedQuery = validateSearchQuery(searchQuery);
  return ok(res, await globalSearch(validatedQuery));
}
