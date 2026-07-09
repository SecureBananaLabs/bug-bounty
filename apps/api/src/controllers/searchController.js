import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const query = req.query.q;
  if (query === undefined || query === null || query.trim() === "") {
    return fail(res, "Search query is required and cannot be blank", 400);
  }
  return ok(res, await globalSearch(query));
}
