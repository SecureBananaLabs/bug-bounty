import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_SEARCH_QUERY_LENGTH = 120;

export async function search(req, res) {
  const query = req.query.q ?? "";

  if (typeof query !== "string") {
    return fail(res, "Search query must be a single string", 400);
  }

  const normalizedQuery = query.trim();

  if (normalizedQuery.length > MAX_SEARCH_QUERY_LENGTH) {
    return fail(res, "Search query is too long", 400);
  }

  return ok(res, await globalSearch(normalizedQuery));
}
