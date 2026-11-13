import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_SEARCH_QUERY_LENGTH = 100;

export async function search(req, res) {
  const query = normalizeSearchQuery(req.query.q);
  if (!query.valid) {
    return fail(res, query.message, 400);
  }

  return ok(res, await globalSearch(query.value));
}

function normalizeSearchQuery(rawQuery) {
  if (rawQuery === undefined) {
    return { valid: true, value: "" };
  }

  if (typeof rawQuery !== "string") {
    return {
      valid: false,
      message: "Search query must be a single string"
    };
  }

  const value = rawQuery.trim();
  if (value.length > MAX_SEARCH_QUERY_LENGTH) {
    return {
      valid: false,
      message: `Search query must be ${MAX_SEARCH_QUERY_LENGTH} characters or fewer`
    };
  }

  return { valid: true, value };
}
