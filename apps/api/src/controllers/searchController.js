import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const query = String(req.query.q ?? "").trim();
  if (query.length > 120) {
    return fail(res, "Search query must be 120 characters or fewer", 400);
  }

  return ok(res, await globalSearch(query));
}
