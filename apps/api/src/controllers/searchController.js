import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_SEARCH_QUERY_LENGTH = 200;

export async function search(req, res) {
  const { q } = req.query;

  if (typeof q !== "string") {
    return fail(res, "Search query must be a single string", 400);
  }

  const query = q.trim();
  if (!query) {
    return fail(res, "Search query is required", 400);
  }

  if (query.length > MAX_SEARCH_QUERY_LENGTH) {
    return fail(res, "Search query must be 200 characters or fewer", 400);
  }

  return ok(res, await globalSearch(query));
}
