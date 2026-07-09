import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

export async function search(req, res) {
  const raw = req.query.q;

  // Reject non-string or repeated parameter values
  if (raw !== undefined && typeof raw !== "string") {
    return fail(res, "Query parameter 'q' must be a string", 400);
  }

  const query = (raw ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  return ok(res, await globalSearch(query));
}
