import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_SEARCH_QUERY_LENGTH = 200;

function normalizeSearchQuery(rawQuery) {
  if (Array.isArray(rawQuery)) {
    return String(rawQuery[0] ?? "").trim();
  }

  return String(rawQuery ?? "").trim();
}

export async function search(req, res) {
  const query = normalizeSearchQuery(req.query.q);

  if (query.length > MAX_SEARCH_QUERY_LENGTH) {
    return fail(res, "Search query is too long", 400);
  }

  return ok(res, await globalSearch(query));
}
