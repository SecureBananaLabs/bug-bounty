import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";
import { searchQuerySchema } from "../validators/search.js";

export async function search(req, res, next) {
  try {
    const { q } = searchQuerySchema.parse(req.query);
    return ok(res, await globalSearch(q));
  } catch (err) {
    return next(err);
  }
}
