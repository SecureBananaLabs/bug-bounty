import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

export async function search(req, res) {
  const query = req.query.q ?? "";
  if (typeof query !== "string" || query.length > MAX_QUERY_LENGTH) {
    return fail(res, "Query must be a string under " + MAX_QUERY_LENGTH + " characters", 400);
  }
  return ok(res, await globalSearch(query));
}
