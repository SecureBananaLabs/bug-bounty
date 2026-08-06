import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

export async function search(req, res) {
  const raw = req.query.q;

  // Reject repeated q parameters (e.g. ?q=a&q=b)
  if (Array.isArray(raw)) {
    return fail(res, "Search query must be a single value", 400);
  }

  // Ensure the query is a string
  if (typeof raw !== "string") {
    return fail(res, "Search query must be a string", 400);
  }

  const query = raw.trim();

  // Reject empty queries
  if (query.length === 0) {
    return fail(res, "Search query cannot be empty", 400);
  }

  // Enforce length limit
  if (query.length > MAX_QUERY_LENGTH) {
    return fail(res, `Search query must not exceed ${MAX_QUERY_LENGTH} characters`, 400);
  }

  return ok(res, await globalSearch(query));
}
