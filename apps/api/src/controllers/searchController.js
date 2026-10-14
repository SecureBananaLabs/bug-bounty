import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const raw = req.query.q ?? "";
  if (typeof raw !== "string" || raw.trim().length > 200) {
    return fail(res, "Query must be a string with at most 200 characters", 400);
  }
  return ok(res, await globalSearch(raw.trim()));
}
