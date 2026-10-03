import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

export async function search(req, res) {
  const rawQuery = req.query.q ?? "";

  if (typeof rawQuery !== "string") {
    return fail(res, "Search query must be a string", 400);
  }

  const query = rawQuery.trim();

  if (query.length > MAX_QUERY_LENGTH) {
    return fail(res, `Search query must be ${MAX_QUERY_LENGTH} characters or less`, 400);
  }

  return ok(res, await globalSearch(query));
}
