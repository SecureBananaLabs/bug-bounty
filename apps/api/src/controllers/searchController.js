import { ok } from "../utils/response.js";
import { fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const q = req.query.q;
  if (typeof q !== "string" || q.trim().length === 0) {
    return fail(res, "Search query is required and must be a string", 400);
  }
  const sanitized = q.trim().slice(0, 200);
  return ok(res, await globalSearch(sanitized));
}
