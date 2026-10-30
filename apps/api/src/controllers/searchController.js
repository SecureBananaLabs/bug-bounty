import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

function normalizeSearchQuery(value) {
  if (value === undefined) {
    return { query: "" };
  }

  if (typeof value !== "string") {
    return { error: "Search query must be a string" };
  }

  const query = value.replace(/[\u0000-\u001F\u007F]/g, "").trim();
  if (query.length > MAX_QUERY_LENGTH) {
    return { error: `Search query must be ${MAX_QUERY_LENGTH} characters or fewer` };
  }

  return { query };
}

export async function search(req, res) {
  const result = normalizeSearchQuery(req.query.q);
  if (result.error) {
    return fail(res, result.error, 400);
  }

  return ok(res, await globalSearch(result.query));
}
