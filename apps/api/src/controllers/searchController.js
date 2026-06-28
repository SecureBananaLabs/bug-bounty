import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

export async function search(req, res) {
  const q = req.query.q;

  if (!q || typeof q !== "string" || q.trim().length === 0) {
    return fail(res, "Search query is required", 400);
  }

  if (q.length > MAX_QUERY_LENGTH) {
    return fail(res, `Search query must not exceed ${MAX_QUERY_LENGTH} characters`, 400);
  }

  return ok(res, await globalSearch(q.trim()));
}
