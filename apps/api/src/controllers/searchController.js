import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const query = req.query.q;

  if (typeof query !== "string" || query.trim().length === 0) {
    return fail(res, "q is required", 400);
  }

  return ok(res, await globalSearch(query));
}
