import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_SEARCH_QUERY_LENGTH = 200;

export function normalizeSearchQuery(value) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const query = String(candidate ?? "").trim();

  if (query.length > MAX_SEARCH_QUERY_LENGTH) {
    return {
      error: `Search query must be ${MAX_SEARCH_QUERY_LENGTH} characters or fewer`
    };
  }

  return { query };
}

export async function search(req, res) {
  const { error, query } = normalizeSearchQuery(req.query.q);
  if (error) {
    return fail(res, error, 400);
  }

  return ok(res, await globalSearch(query));
}
