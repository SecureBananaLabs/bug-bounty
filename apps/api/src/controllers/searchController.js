import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export const MAX_SEARCH_QUERY_LENGTH = 200;

function normalizeSearchQuery(value) {
  if (value === undefined || value === null) {
    return "";
  }

  if (Array.isArray(value)) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  return value.trim().replace(/[\u0000-\u001f\u007f]/g, "");
}

export async function search(req, res) {
  const query = normalizeSearchQuery(req.query.q);

  if (query === null) {
    return fail(res, "Search query must be a string");
  }

  if (query.length > MAX_SEARCH_QUERY_LENGTH) {
    return fail(res, `Search query must be ${MAX_SEARCH_QUERY_LENGTH} characters or fewer`);
  }

  return ok(res, await globalSearch(query));
}
