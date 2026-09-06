import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";
import { searchSchema } from "../validators/search.js";

export async function search(req, res) {
  const payload = searchSchema.parse(req.query);
  return ok(res, await globalSearch(payload.q));
}
