import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const query = req.query.q ?? "";
  if (typeof query !== "string" || query.length > 100) {
    return fail(res, "Invalid query", 400);
  }
  return ok(res, await globalSearch(query));
}
