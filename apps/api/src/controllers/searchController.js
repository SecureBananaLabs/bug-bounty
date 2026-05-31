import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_SEARCH_QUERY_LENGTH = 200;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/g;

function normalizeSearchQuery(query) {
  if (query === undefined) {
    return "";
  }

  if (Array.isArray(query) || typeof query !== "string") {
    throw new Error("Search query must be a single string");
  }

  if (query.length > MAX_SEARCH_QUERY_LENGTH) {
    throw new Error(`Search query must be ${MAX_SEARCH_QUERY_LENGTH} characters or fewer`);
  }

  return query.replace(CONTROL_CHARACTERS, "").trim();
}

export async function search(req, res) {
  let query;

  try {
    query = normalizeSearchQuery(req.query.q);
  } catch (error) {
    return fail(res, error.message, 400);
  }

  return ok(res, await globalSearch(query));
}
