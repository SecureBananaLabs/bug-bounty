import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

export async function search(req, res) {
  let q = req.query.q;
  if (Array.isArray(q)) return fail(res, "Query parameter q must be a single string", 400);
  if (typeof q !== "string") q = "";
  q = q.trim().slice(0, MAX_QUERY_LENGTH);
  return ok(res, await globalSearch(q));
}
