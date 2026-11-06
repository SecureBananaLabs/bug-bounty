import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

export async function search(req, res) {
  const query = String(req.query.q ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  return ok(res, await globalSearch(query));
}
