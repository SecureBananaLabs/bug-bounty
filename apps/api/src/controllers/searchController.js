import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";
import { badRequest } from "../utils/response.js";

export async function search(req, res) {
  const rawQuery = req.query.q;

  // Reject non-string input (e.g., repeated query parameters become arrays)
  if (rawQuery !== undefined && typeof rawQuery !== "string") {
    return badRequest(res, "Search query must be a single string");
  }

  const query = (rawQuery ?? "").trim();

  // Reject empty query after trimming
  if (query.length === 0) {
    return badRequest(res, "Search query is required");
  }

  const MAX_QUERY_LENGTH = 200;

  // Enforce maximum length limit
  if (query.length > MAX_QUERY_LENGTH) {
    return badRequest(res, `Search query exceeds maximum length of ${MAX_QUERY_LENGTH} characters`);
  }

  return ok(res, await globalSearch(query));
}
