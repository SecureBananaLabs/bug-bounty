import { ok } from "../utils/response.js";
import { fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const q = req.query.q;

  if (typeof q !== "string" || q.trim().length === 0) {
    return fail(res, "Invalid search query", 400);
  }

  if (q.length > 120) {
    return fail(res, "Invalid search query", 400);
  }

  return ok(res, await globalSearch(q.trim()));
}
