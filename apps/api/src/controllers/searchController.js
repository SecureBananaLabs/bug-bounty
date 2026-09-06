import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_SEARCH_QUERY_LENGTH = 200;

function normalizeSearchQuery(rawQuery) {
  const value = Array.isArray(rawQuery) ? rawQuery[0] : rawQuery;
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, MAX_SEARCH_QUERY_LENGTH);
}

export async function search(req, res) {
  const query = normalizeSearchQuery(req.query.q);
  return ok(res, await globalSearch(query));
}
