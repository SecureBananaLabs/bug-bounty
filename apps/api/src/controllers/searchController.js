import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

export async function search(req, res) {
  const q = req.query.q ?? "";
  if (q.length > MAX_QUERY_LENGTH) {
    return ok(res, { error: "Query too long", maxLength: MAX_QUERY_LENGTH }, 400);
  }
  return ok(res, await globalSearch(q));
}
