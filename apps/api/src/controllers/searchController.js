import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

export async function search(req, res) {
  const raw = req.query.q;
  
  // Reject non-string query parameters
  if (raw !== undefined && typeof raw !== "string") {
    return fail(res, "Invalid query parameter", 400);
  }
  
  // Validate and sanitize
  const query = (raw ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  
  if (query.length === 0) {
    return ok(res, await globalSearch(""));
  }
  
  return ok(res, await globalSearch(query));
}

