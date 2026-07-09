import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const query = req.query.q ?? "";

  if (typeof query !== "string") {
    return fail(res, "Search query must be a string", 400);
  }

  if (query.length > 100) {
    return fail(res, "Search query must be 100 characters or fewer", 400);
  }

  return ok(res, await globalSearch(query));
}
