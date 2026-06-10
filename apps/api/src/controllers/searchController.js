import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_SEARCH_QUERY_LENGTH = 200;

export async function search(req, res) {
  const { q } = req.query;

  if (q === undefined) {
    return ok(res, await globalSearch(""));
  }

  if (typeof q !== "string") {
    return fail(res, "Search query must be a single string", 400);
  }

  if (q.length > MAX_SEARCH_QUERY_LENGTH) {
    return fail(res, "Search query must be 200 characters or fewer", 400);
  }

  return ok(res, await globalSearch(q));
}
