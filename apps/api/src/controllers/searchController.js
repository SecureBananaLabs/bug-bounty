import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 100;

export async function search(req, res) {
  const raw = req.query.q;
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return fail(res, "Missing or empty search query parameter 'q'", 400);
  }

  const q = raw.trim().slice(0, MAX_QUERY_LENGTH);
  return ok(res, await globalSearch(q));
}
