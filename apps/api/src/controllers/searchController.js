import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";
import { validateSearchQuery } from "../validators/search.js";

export async function search(req, res) {
  const validation = validateSearchQuery(req.query?.q);
  if (!validation.valid) {
    return fail(res, validation.error, 400);
  }

  return ok(res, await globalSearch(validation.data.q));
}
