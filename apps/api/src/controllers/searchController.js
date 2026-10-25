import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";
import { searchQuerySchema } from "../validators/search.js";

export async function search(req, res) {
  const query = searchQuerySchema.parse(req.query.q);
  return ok(res, await globalSearch(query));
}
