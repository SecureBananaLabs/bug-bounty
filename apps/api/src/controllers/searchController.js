import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

export async function search(req, res) {
  const raw = req.query.q;

  if (typeof raw !== "string") {
    return fail(res, "Search query must be a string", 400);
  }

  const q = raw.trim();

  if (q.length === 0) {
    return fail(res, "Search query is required", 400);
  }

  if (q.length > MAX_QUERY_LENGTH) {
    return fail(res, `Query exceeds maximum length of ${MAX_QUERY_LENGTH} characters`, 400);
  }

  return ok(res, await globalSearch(q));
}
