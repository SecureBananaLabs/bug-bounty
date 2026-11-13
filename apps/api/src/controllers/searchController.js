import { ok } from "../utils/response.js";
import { fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

function normalizeQuery(value) {
  if (value == null || value === "") {
    return "";
  }

  if (Array.isArray(value) || typeof value === "object") {
    return null;
  }

  const query = String(value).trim();
  if (query.length > MAX_QUERY_LENGTH) {
    return null;
  }

  return query;
}

export async function search(req, res) {
  const query = normalizeQuery(req.query.q);
  if (query === null) {
    return fail(res, "Search query must be 200 characters or fewer", 400);
  }

  return ok(res, await globalSearch(query));
}
