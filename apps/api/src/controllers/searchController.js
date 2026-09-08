import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const q = req.query.q ?? "";

  if (Array.isArray(q)) {
    return fail(res, "Query parameter q must be a single string, not an array.", 400);
  }

  const trimmed = String(q).trim().slice(0, 200);
  return ok(res, await globalSearch(trimmed));
}
