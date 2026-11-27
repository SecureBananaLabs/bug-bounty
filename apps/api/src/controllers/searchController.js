import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res, next) {
  try {
    const q = req.query.q ?? "";
    const results = await globalSearch(q);
    return ok(res, results);
  } catch (err) {
    return next(err);
  }
}
