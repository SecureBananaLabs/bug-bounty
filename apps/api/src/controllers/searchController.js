import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";
import { searchSchema } from "../validators/search.js";

export async function search(req, res) {
  const parsed = searchSchema.safeParse(req.query);

  if (!parsed.success) {
    return fail(res, parsed.error.errors[0].message);
  }

  const { q } = parsed.data;

  if (q.length === 0) {
    return fail(res, "Search query is required", 400);
  }

  return ok(res, await globalSearch(q));
}
