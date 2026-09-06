import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (q.length > 200) {
    return fail(res, "Search query must not exceed 200 characters", 400);
  }
  return ok(res, await globalSearch(q));
}
