import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";
import { searchSchema } from "../validators/search.js";

export async function search(req, res, next) {
  try {
    const query = searchSchema.parse(req.query);
    return ok(res, await globalSearch(query.q));
  } catch (err) {
    return next(err);
  }
}
