import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const query = String(req.query.q ?? "");
  if (query.length > 200) {
    return fail(res, "Query must be 200 characters or fewer", 400);
  }

  return ok(res, await globalSearch(query));
}
