import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

export async function search(req, res) {
  const query = req.query.q;

  if (Array.isArray(query) || (query !== undefined && typeof query !== "string")) {
    return fail(res, "Search query must be a single string", 400);
  }

  const normalizedQuery = query ?? "";

  if (normalizedQuery.length > MAX_QUERY_LENGTH) {
    return fail(res, `Search query must be ${MAX_QUERY_LENGTH} characters or fewer`, 400);
  }

  return ok(res, await globalSearch(normalizedQuery));
}
