import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

export async function search(req, res) {
  const query = req.query.q;
  
  // Validate query parameter
  if (query !== undefined && query !== null) {
    // Must be a string
    if (typeof query !== "string") {
      return fail(res, "Query parameter must be a string", 400);
    }
    
    // Trim and check length
    const trimmed = query.trim();
    if (trimmed.length > MAX_QUERY_LENGTH) {
      return fail(res, `Query exceeds maximum length of ${MAX_QUERY_LENGTH} characters`, 400);
    }
    
    // Use trimmed query
    return ok(res, await globalSearch(trimmed));
  }
  
  // No query provided, search with empty string
  return ok(res, await globalSearch(""));
}
