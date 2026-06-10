import { ok } from "../utils/response.js";
import { globalSearch } => { globalSearch } from "../services/searchService.js";

function validateSearchQuery(query) {
  if (typeof query !== 'string') {
    throw new Error('Search query must be a string');
  }

  const trimmedQuery = query.trim();
  if (trimmedQuery.length > 200) {
    throw new Error('Search query must not exceed 200 characters');
  }

  return trimmedQuery;
}

export async function search(req, res) {
  try {
    const query = req.query.q;
    if (query === undefined) {
      return ok(res, await globalSearch(""));
    }
    const validatedQuery = validateSearchQuery(query);
    return ok(res, await globalSearch(validatedQuery));
  } catch (error) {
    throw error;
  }
}
