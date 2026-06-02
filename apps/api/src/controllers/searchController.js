import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";
import { parseSearchQuery } from "../validators/search.js";

export async function search(req, res) {
  const parsed = parseSearchQuery(req.query);

  if (!parsed.success) {
    return fail(res, parsed.message, 400);
  }

  return ok(res, await globalSearch(parsed.query));
}
