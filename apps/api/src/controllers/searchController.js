import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

export async function search(req, res) {
  const raw = req.query.q;

  if (Array.isArray(raw)) {
    return fail(res, "Query parameter 'q' must be a single string", 400);
  }

  const q = typeof raw === "string" ? raw.trim() : "";

  if (q.length > MAX_QUERY_LENGTH) {
    return fail(
      res,
      `Query parameter 'q' must not exceed ${MAX_QUERY_LENGTH} characters`,
      400
    );
  }

  return ok(res, await globalSearch(q));
}
