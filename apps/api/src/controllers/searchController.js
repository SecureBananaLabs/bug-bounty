import { BadRequest } from "../utils/errors.js";
import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

function validateSearchQuery(query) {
  if (query === undefined || query === null) {
    return "";
  }
  
  if (typeof query !== 'string') {
    throw new BadRequest("Search query must be a string");
  }
  
  const trimmedQuery = query.trim().substring(0, 200);
  return trimmedQuery;
}

export async function search(req, res) {
  const validatedQuery = validateSearchQuery(req.query.q);
  return ok(res, await globalSearch(validatedQuery));
}
