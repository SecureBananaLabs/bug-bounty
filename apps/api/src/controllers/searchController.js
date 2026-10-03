import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

export async function search(req, res) {
  const rawQuery = req.query.q ?? "";
  if (Array.isArray(rawQuery) || typeof rawQuery !== "string") {
    return fail(res, "search query must be a string", 400);
  }

  const query = rawQuery.trim();
  if (query.length > MAX_QUERY_LENGTH) {
    return fail(res, `search query must be ${MAX_QUERY_LENGTH} characters or fewer`, 400);
  }

  return ok(res, await globalSearch(query));
}
