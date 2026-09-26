import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_SEARCH_QUERY_LENGTH = 128;

export async function search(req, res) {
  const rawQuery = req.query.q ?? "";
  if (typeof rawQuery !== "string") {
    return fail(res, "Search query must be a single string", 400);
  }

  const query = rawQuery.trim();
  if (query.length > MAX_SEARCH_QUERY_LENGTH) {
    return fail(res, "Search query is too long", 400);
  }

  return ok(res, await globalSearch(query));
}
