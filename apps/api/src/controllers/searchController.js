import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const { q = "" } = req.query;

  if (Array.isArray(q)) {
    return fail(res, "q must be a single string");
  }

  if (typeof q !== "string") {
    return fail(res, "q must be a string");
  }

  const query = q.trim();

  if (query.length > 200) {
    return fail(res, "q must be 200 characters or fewer");
  }

  return ok(res, await globalSearch(query));
}
