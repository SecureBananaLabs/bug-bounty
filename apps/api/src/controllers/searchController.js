import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const query = String(req.query.q ?? "").trim();
  if (!query) {
    return fail(res, "Search query is required", 400);
  }

  return ok(res, await globalSearch(query));
}
