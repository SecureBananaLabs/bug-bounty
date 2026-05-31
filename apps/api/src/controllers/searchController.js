import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";
import { sanitizeSearchQuery } from "../validators/search.js";

export async function search(req, res) {
  // req.query has already been validated by middleware;
  // sanitize as a defense-in-depth measure
  const q = sanitizeSearchQuery(req.query.q);
  return ok(res, await globalSearch(q));
}
