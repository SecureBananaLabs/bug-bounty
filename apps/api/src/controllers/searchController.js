import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

export async function search(req, res) {
  const raw = req.query.q;
  if (raw === undefined || raw === null) {
    return ok(res, await globalSearch(""));
  }
  if (typeof raw !== "string") {
    return fail(res, "Query must be a string", 400);
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return ok(res, await globalSearch(""));
  }
  if (trimmed.length > MAX_QUERY_LENGTH) {
    return fail(res, `Query exceeds maximum length of ${MAX_QUERY_LENGTH} characters`, 400);
  }
  return ok(res, await globalSearch(trimmed));
}
