import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const raw = req.query.q;
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return fail(res, "Query parameter 'q' must be a non-empty string", 400);
  }
  return ok(res, await globalSearch(raw.trim()));
}
