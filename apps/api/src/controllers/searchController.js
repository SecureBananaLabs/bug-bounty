import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";
import { normalizeSearchQuery } from "../validators/search.js";

export async function search(req, res) {
  const parsed = normalizeSearchQuery(req.query.q);
  if (parsed.error) {
    return fail(res, parsed.error, 400);
  }

  return ok(res, await globalSearch(parsed.value));
}
