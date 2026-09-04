import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_SEARCH_QUERY_LENGTH = 200;
const SEARCH_QUERY_PATTERN = /^[a-zA-Z0-9\s._-]*$/;

function normalizeSearchQuery(value) {
  if (value === undefined) {
    return { query: "" };
  }

  if (typeof value !== "string") {
    return { error: "Search query must be a single string" };
  }

  const query = value.trim();

  if (query.length > MAX_SEARCH_QUERY_LENGTH) {
    return { error: `Search query must be ${MAX_SEARCH_QUERY_LENGTH} characters or fewer` };
  }

  if (!SEARCH_QUERY_PATTERN.test(query)) {
    return { error: "Search query contains unsupported characters" };
  }

  return { query };
}

export async function search(req, res) {
  const normalized = normalizeSearchQuery(req.query.q);

  if (normalized.error) {
    return fail(res, normalized.error, 400);
  }

  return ok(res, await globalSearch(normalized.query));
}
