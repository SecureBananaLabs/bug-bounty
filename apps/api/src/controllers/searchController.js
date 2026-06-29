import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_SEARCH_QUERY_LENGTH = 200;

function normalizeSearchQuery(value) {
  const rawQuery = Array.isArray(value) ? value[0] : value;
  return String(rawQuery ?? "").trim();
}

export async function search(req, res) {
  const query = normalizeSearchQuery(req.query.q);

  if (query.length > MAX_SEARCH_QUERY_LENGTH) {
    return fail(res, `Search query must be ${MAX_SEARCH_QUERY_LENGTH} characters or fewer`);
  }

  return ok(res, await globalSearch(query));
}
