import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

export async function search(req, res) {
  let query = (req.query.q ?? "").trim();
  if (query.length > MAX_QUERY_LENGTH) {
    query = query.slice(0, MAX_QUERY_LENGTH);
  }
  // Strip potentially dangerous characters for search
  query = query.replace(/[<>"'{}()|]/g, "");
  return ok(res, await globalSearch(query));
}
