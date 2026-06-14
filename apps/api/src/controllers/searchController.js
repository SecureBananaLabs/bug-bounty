import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_SEARCH_QUERY_LENGTH = 120;

export async function search(req, res) {
  const { q = "" } = req.query;

  if (Array.isArray(q) || typeof q !== "string") {
    return fail(res, "Search query must be a single string", 400);
  }

  const query = q.trim();

  if (query.length > MAX_SEARCH_QUERY_LENGTH) {
    return fail(res, `Search query must be ${MAX_SEARCH_QUERY_LENGTH} characters or fewer`, 400);
  }

  return ok(res, await globalSearch(query));
}
