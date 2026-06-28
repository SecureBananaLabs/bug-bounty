import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const raw = req.query.q;

  // Validate: reject non-string query input (arrays, objects, repeated params)
  if (raw !== undefined && typeof raw !== "string") {
    return fail(res, "Query parameter 'q' must be a single string value");
  }

  // Default to empty string, trim whitespace
  const query = (raw ?? "").trim();

  // Length limit: reject queries longer than 200 characters
  if (query.length > 200) {
    return fail(res, "Search query exceeds maximum length of 200 characters");
  }

  return ok(res, await globalSearch(query));
}
