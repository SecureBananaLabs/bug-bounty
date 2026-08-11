import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const query = req.query.q ?? "";

  // 1. Enforce string type
  if (typeof query !== "string") {
    return fail(res, "Query must be a string", 400);
  }

  // 2. Validate maximum length (100 characters) to prevent DoS
  if (query.length > 100) {
    return fail(res, "Query exceeds maximum length of 100 characters", 400);
  }

  // 3. Prevent empty/whitespace queries
  if (query.trim().length === 0) {
    return fail(res, "Query cannot be empty or only whitespace", 400);
  }

  return ok(res, await globalSearch(query));
}
