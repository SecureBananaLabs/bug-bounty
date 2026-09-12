import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_SEARCH_QUERY_LENGTH = 200;

export async function search(req, res) {
  const rawQuery = req.query.q ?? "";

  if (Array.isArray(rawQuery) || typeof rawQuery !== "string") {
    return fail(res, "Search query must be a string");
  }

  const query = rawQuery.trim();

  if (query.length > MAX_SEARCH_QUERY_LENGTH) {
    return fail(res, "Search query must be 200 characters or fewer");
  }

  return ok(res, await globalSearch(query));
}
