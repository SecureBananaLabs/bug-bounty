import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";
import { searchQuerySchema } from "../validators/search.js";

export async function search(req, res) {
  const result = searchQuerySchema.safeParse(req.query.q ?? "");

  if (!result.success) {
    return fail(res, "Invalid search query", 400);
  }

  return ok(res, await globalSearch(result.data));
}
