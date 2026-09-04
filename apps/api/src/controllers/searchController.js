import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

export async function search(req, res) {
  const q = req.query.q;

  // Reject non-string input (e.g., repeated q parameters result in array)
  if (q !== undefined && typeof q !== "string") {
    return fail(res, "Query parameter 'q' must be a string", 400);
  }

  // Trim and use empty string as default
  const query = (q ?? "").trim();

  // Enforce length limit
  if (query.length > MAX_QUERY_LENGTH) {
    return fail(res, `Query parameter 'q' must not exceed ${MAX_QUERY_LENGTH} characters`, 400);
  }

  return ok(res, await globalSearch(query));
}
