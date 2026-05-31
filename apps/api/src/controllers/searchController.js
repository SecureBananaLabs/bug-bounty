import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

export async function search(req, res) {
  const query = (req.query.q ?? "").trim();

  if (typeof query !== "string") {
    return fail(res, "Search query must be a string", 400);
  }

  if (query.length > MAX_QUERY_LENGTH) {
    return fail(res, `Search query must be at most ${MAX_QUERY_LENGTH} characters`, 400);
  }

  return ok(res, await globalSearch(query));
}
