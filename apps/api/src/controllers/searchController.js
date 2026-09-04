import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const { q } = req.query;

  if (typeof q !== "string" || q.trim().length === 0) {
    return fail(res, "Search query is required");
  }

  return ok(res, await globalSearch(q));
}
