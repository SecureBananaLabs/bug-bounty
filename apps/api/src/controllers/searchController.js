import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const { q = "" } = req.query;

  if (typeof q !== "string") {
    return fail(res, "Search query must be a string");
  }

  if (q.length > 200) {
    return fail(res, "Search query must be 200 characters or fewer");
  }

  return ok(res, await globalSearch(q));
}
