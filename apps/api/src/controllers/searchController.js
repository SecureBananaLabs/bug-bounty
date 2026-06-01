import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_SEARCH_QUERY_LENGTH = 120;

function normalizeSearchQuery(rawQuery) {
  if (rawQuery === undefined) {
    return { valid: true, query: "" };
  }

  if (typeof rawQuery !== "string") {
    return { valid: false, message: "Search query must be a single string" };
  }

  const query = rawQuery.trim();
  if (query.length > MAX_SEARCH_QUERY_LENGTH) {
    return { valid: false, message: `Search query must be ${MAX_SEARCH_QUERY_LENGTH} characters or fewer` };
  }

  return { valid: true, query };
}

export async function search(req, res) {
  const result = normalizeSearchQuery(req.query.q);
  if (!result.valid) {
    return fail(res, result.message, 400);
  }

  return ok(res, await globalSearch(result.query));
}
