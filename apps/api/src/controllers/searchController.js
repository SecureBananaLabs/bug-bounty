import { ok, badRequest } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const q = req.query.q;
  if (typeof q !== 'string' || q.trim().length === 0) {
    return badRequest(res, 'Query parameter q must be a non-empty string.');
  }
  const sanitized = q.trim().substring(0, 200);
  return ok(res, await globalSearch(sanitized));
}