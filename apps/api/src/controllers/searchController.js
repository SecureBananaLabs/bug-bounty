import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_SEARCH_QUERY_LENGTH = 200;

export async function search(req, res) {
  const rawQuery = req.query.q ?? "";

  if (Array.isArray(rawQuery) || typeof rawQuery !== "string") {
    return fail(res, "Search query must be a string.", 400);
  }

  const query = rawQuery.trim();

  if (query.length > MAX_SEARCH_QUERY_LENGTH) {
    return fail(res, `Search query must be ${MAX_SEARCH_QUERY_LENGTH} characters or fewer.`, 400);
  }

  return ok(res, await globalSearch(query));
}
import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  return ok(res, await globalSearch(req.query.q ?? ""));
}
