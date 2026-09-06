import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

export async function search(req, res) {
  const query = (req.query.q ?? "").trim();
  if (query.length === 0) {
    return fail(res, "Query parameter 'q' is required");
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return fail(res, `Query parameter 'q' must be at most ${MAX_QUERY_LENGTH} characters`);
  }
  return ok(res, await globalSearch(query));
}
