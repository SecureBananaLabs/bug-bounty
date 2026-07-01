import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const rawQuery = req.query.q ?? "";
  if (typeof rawQuery !== "string") {
    return fail(res, "Search query must be a string", 400);
  }

  const query = rawQuery.trim();
  if (query.length > 200) {
    return fail(res, "Search query must be 200 characters or fewer", 400);
  }

  return ok(res, await globalSearch(query));
}
