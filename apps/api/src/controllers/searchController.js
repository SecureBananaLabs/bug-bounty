import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";
import { searchQuerySchema } from "../validators/search.js";

export async function search(req, res) {
  const { q } = searchQuerySchema.parse(req.query);
  return ok(res, await globalSearch(q));
}
