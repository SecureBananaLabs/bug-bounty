import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const { q } = req.query;

  if (q === undefined) {
    return ok(res, await globalSearch(""));
  }

  if (typeof q !== "string") {
    return fail(res, "Search query must be a single string");
  }

  const query = q.trim();

  if (query.length > 200) {
    return fail(res, "Search query is too long (max 200 characters)");
  }

  return ok(res, await globalSearch(query));
}
