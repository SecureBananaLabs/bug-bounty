import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 256;

export async function search(req, res) {
  const q = req.query.q ?? "";
  if (typeof q !== "string" || q.length > MAX_QUERY_LENGTH) {
    return ok(res, { query: q, users: [], jobs: [], freelancers: [] });
  }
  return ok(res, await globalSearch(q));
}
