import { ok } from "../utils/response.js";
import { fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

export async function search(req, res) {
  const raw = req.query.q;

  // Reject non-string or missing query (type coercion from Express could
  // produce arrays if ?q=a&q=b is sent).
  if (typeof raw !== "string") {
    return fail(res, "Query parameter q is required and must be a string.", 400);
  }

  // Trim whitespace and strip ASCII control characters to prevent log injection.
  const query = raw.trim().replace(/[\x00-\x1F\x7F]/g, "");

  if (query.length > MAX_QUERY_LENGTH) {
    return fail(res, `Query must not exceed ${MAX_QUERY_LENGTH} characters.`, 400);
  }

  return ok(res, await globalSearch(query));
}

