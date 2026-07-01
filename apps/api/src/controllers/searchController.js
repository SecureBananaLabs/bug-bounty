import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_SEARCH_QUERY_LENGTH = 100;

export async function search(req, res) {
  const query = req.query.q ?? "";

  if (typeof query !== "string") {
    return fail(res, "Search query must be a string");
  }

  if (query.length > MAX_SEARCH_QUERY_LENGTH) {
    return fail(
      res,
      `Search query must be ${MAX_SEARCH_QUERY_LENGTH} characters or fewer`
    );
  }

  return ok(res, await globalSearch(query));
}
