import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const query = req.query.q ?? "";

  if (query.length > 100) {
    return fail(res, "Query too long. Maximum length is 100 characters.", 400);
  }

  return ok(res, await globalSearch(query));
}
