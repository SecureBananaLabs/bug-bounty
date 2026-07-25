import { ok } from "../utils/response.js";
import { fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const query = req.query.q;
  if (!query || !query.trim()) {
    return fail(res, "Query parameter 'q' is required", 400);
  }
  return ok(res, await globalSearch(query));
}
