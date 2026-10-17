import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";
import { searchQuerySchema } from "../validators/search.js";

export async function search(req, res) {
  const parsed = searchQuerySchema.safeParse({ q: req.query.q ?? "" });
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid search query";
    return fail(res, message, 400);
  }

  return ok(res, await globalSearch(parsed.data.q));
}
