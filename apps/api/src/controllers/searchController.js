import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const q = req.query?.q;

  if (typeof q !== "string") {
    return fail(res, "Invalid search query", 400);
  }

  const normalizedQuery = q.trim();
  if (!normalizedQuery) {
    return fail(res, "Search query cannot be empty", 400);
  }

  if (normalizedQuery.length > 200) {
    return fail(res, "Search query is too long", 400);
  }

  return ok(res, await globalSearch(normalizedQuery));
}
