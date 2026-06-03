import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

export async function search(req, res) {
  const raw = req.query.q ?? "";
  if (typeof raw !== "string" || raw.length > MAX_QUERY_LENGTH) {
    return fail(res, `Search query exceeds maximum length of ${MAX_QUERY_LENGTH} characters`, 400);
  }
  return ok(res, await globalSearch(raw.trim()));
}
