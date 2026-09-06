import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const maxQueryLength = 200;

function normalizeSearchQuery(value) {
  if (value === undefined) return "";
  if (typeof value !== "string") return null;

  const query = value.trim();
  if (query.length > maxQueryLength) return null;
  return query;
}

export async function search(req, res) {
  const query = normalizeSearchQuery(req.query.q);

  if (query === null) {
    return fail(res, "Invalid search query", 400);
  }

  return ok(res, await globalSearch(query));
}
