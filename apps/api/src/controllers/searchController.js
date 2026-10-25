import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  let q = req.query.q;

  // Keep empty or omitted queries safe
  if (q === undefined || q === null) {
    q = "";
  }

  // Coerce to a string
  q = String(q);

  // Trim surrounding whitespace
  q = q.trim();

  // Reject overly long input with 400 (setting 100 characters max limit)
  if (q.length > 100) {
    return fail(res, "Query parameter is too long", 400);
  }

  return ok(res, await globalSearch(q));
}

