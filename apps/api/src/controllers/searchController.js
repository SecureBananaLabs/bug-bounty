import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";
import { searchQuerySchema } from "../validators/search.js";

export async function search(req, res, next) {
  try {
    const validated = searchQuerySchema.parse(req.query);
    const result = await globalSearch(validated.q);
    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}
