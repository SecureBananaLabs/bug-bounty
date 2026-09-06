import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";
import { searchQuerySchema } from "../validators/search.js";

export async function search(req, res) {
  const result = searchQuerySchema.safeParse(req.query);

  if (!result.success) {
    return fail(res, result.error.issues[0]?.message ?? "Invalid search query", 400);
  }

  return ok(res, await globalSearch(result.data.q));
}
