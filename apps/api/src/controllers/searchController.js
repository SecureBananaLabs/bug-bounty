import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";
import { searchSchema } from "../validators/search.js";

export async function search(req, res) {
  const result = searchSchema.safeParse(req.query);
  if (!result.success) {
    return fail(res, result.error.errors[0].message, 400);
  }
  return ok(res, await globalSearch(result.data.q));
}
