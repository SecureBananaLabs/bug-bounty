import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";
import { searchQuerySchema } from "../validators/search.js";

export async function search(req, res) {
  const parsedQuery = searchQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    return fail(res, "Invalid search query");
  }

  return ok(res, await globalSearch(parsedQuery.data.q.trim()));
}
