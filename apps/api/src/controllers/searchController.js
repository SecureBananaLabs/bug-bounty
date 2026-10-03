import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

export async function search(req, res) {
  const q = (req.query.q ?? "").toString().trim().slice(0, MAX_QUERY_LENGTH);
  if (!q) {
    return fail(res, "Query parameter 'q' is required", 400);
  }
  return ok(res, await globalSearch(q));
}
