import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";
import { parseSearchQuery } from "../validators/search.js";

export async function search(req, res) {
  let query;

  try {
    query = parseSearchQuery(req.query);
  } catch (error) {
    return fail(res, error.message, 400);
  }

  return ok(res, await globalSearch(query));
}
