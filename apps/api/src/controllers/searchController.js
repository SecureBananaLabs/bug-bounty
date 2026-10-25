import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_SEARCH_QUERY_LENGTH = 200;

function normalizeSearchQuery(query) {
  if (query === undefined) {
    return { value: "" };
  }

  if (Array.isArray(query)) {
    return { error: "Search query must be a single value" };
  }

  if (typeof query !== "string") {
    return { error: "Search query must be a string" };
  }

  return { value: query.trim().replace(/[\u0000-\u001f\u007f]/g, "") };
}

export async function search(req, res) {
  const { value: query, error } = normalizeSearchQuery(req.query.q);

  if (error) {
    return fail(res, error, 400);
  }

  if (query.length > MAX_SEARCH_QUERY_LENGTH) {
    return fail(res, "Search query must be 200 characters or fewer", 400);
  }

  return ok(res, await globalSearch(query));
}
