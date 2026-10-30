import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

export async function search(req, res) {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";

  if (!query) {
    return fail(res, "Search query is required", 400);
  }

  if (query.length > MAX_QUERY_LENGTH) {
    return fail(res, `Search query must be ${MAX_QUERY_LENGTH} characters or fewer`, 400);
  }

  return ok(res, await globalSearch(query));
}
