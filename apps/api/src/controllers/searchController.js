import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  let q = req.query.q;

  if (q === undefined) {
    q = "";
  }

  if (typeof q !== "string") {
    return fail(res, "Invalid search query parameter: must be a string", 400);
  }

  q = q.trim();

  if (q.length > 200) {
    return fail(res, "Search query is too long (maximum 200 characters)", 400);
  }

  return ok(res, await globalSearch(q));
}
