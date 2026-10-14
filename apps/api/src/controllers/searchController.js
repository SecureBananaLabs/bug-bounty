import { ok } from "../utils/response.js";
import { fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const rawQuery = req.query.q ?? "";
  if (Array.isArray(rawQuery) || typeof rawQuery !== "string") {
    return fail(res, "Invalid query", 400);
  }

  const trimmedQuery = rawQuery.trim();
  if (trimmedQuery.length > 200) {
    return fail(res, "Invalid query", 400);
  }

  return ok(res, await globalSearch(trimmedQuery));
}
