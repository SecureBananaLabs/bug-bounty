import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

export async function search(req, res) {
  const rawQuery = req.query.q ?? "";
  if (Array.isArray(rawQuery)) {
    return fail(res, "Search query must be a single value", 400);
  }

  const query = String(rawQuery).trim().slice(0, MAX_QUERY_LENGTH);
  return ok(res, await globalSearch(query));
}
