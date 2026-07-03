import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_SEARCH_QUERY_LENGTH = 200;

function normalizeSearchQuery(query) {
  return query.trim().slice(0, MAX_SEARCH_QUERY_LENGTH);
}

export async function search(req, res) {
  const { q } = req.query;

  if (Array.isArray(q)) {
    return fail(res, "Search query must be a single string", 400);
  }

  const query = typeof q === "string" ? q : "";
  return ok(res, await globalSearch(normalizeSearchQuery(query)));
}
