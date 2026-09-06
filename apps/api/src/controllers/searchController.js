import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const q = req.query.q ?? "";
  if (!q || q.length === 0) return fail(res, "Query parameter q is required", 400);
  if (q.length > 200) return fail(res, "Query parameter q must not exceed 200 characters", 400);
  return ok(res, await globalSearch(q));
}
