import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";
export async function search(req, res) {
  let q = req.query.q;
  if (Array.isArray(q)) return fail(res, "q must be a single string", 400);
  q = (typeof q === "string" ? q : "").trim().slice(0, 200);
  return ok(res, await globalSearch(q));
}
