import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const query = req.query.q;
  if (!query || typeof query !== "string" || query.trim() === "") {
    return fail(res, "Search query is required and cannot be blank", 400);
  }
  if (query.length > 200) {
    return fail(res, "Search query exceeds maximum length of 200 characters", 400);
  }
  return ok(res, await globalSearch(query));
}
