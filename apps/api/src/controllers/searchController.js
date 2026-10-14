import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

export async function search(req, res) {
  const rawQuery = req.query.q;

  // Coerce to string
  const query = typeof rawQuery === "string" ? rawQuery.trim() : "";

  // Reject overly long input
  if (query.length > MAX_QUERY_LENGTH) {
    return fail(res, `Query too long. Maximum length is ${MAX_QUERY_LENGTH} characters`, 400);
  }

  return ok(res, await globalSearch(query));
}
