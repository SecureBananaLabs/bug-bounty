import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  let query = req.query.q ?? "";

  if (typeof query !== "string") {
    return fail(res, "Query must be a string", 400);
  }

  query = query.trim();

  if (query.length > 200) {
    return fail(res, "Query length exceeds the limit of 200 characters", 400);
  }

  // Basic sanitization: strip potential HTML/script tags
  query = query.replace(/<[^>]*>/g, "");

  return ok(res, await globalSearch(query));
}
