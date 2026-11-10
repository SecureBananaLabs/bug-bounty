import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

export async function search(req, res) {
  const q = (req.query.q ?? "").slice(0, MAX_QUERY_LENGTH);
  if (!q || q.length < 2) {
    return ok(res, []);
  }
  return ok(res, await globalSearch(q));
}