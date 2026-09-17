import { ok, fail } from "../utils/response.js";
import { validateSearchQuery } from "../validators/search.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const validation = validateSearchQuery(req.query);
  if (!validation.ok) {
    return fail(res, validation.error, 400);
  }
  return ok(res, await globalSearch(validation.data.q));
}

