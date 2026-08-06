import { ok, badRequest } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";
import { searchQuerySchema } from "../validators/searchValidator.js";

export async function search(req, res) {
  const parsed = searchQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return badRequest(res, parsed.error.errors[0].message);
  }
  return ok(res, await globalSearch(parsed.data.q));
}
