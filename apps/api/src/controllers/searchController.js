import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

export async function search(req, res) {
  let query = (req.query.q ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  if (!query) {
    return ok(res, { query: "", users: [], jobs: [], freelancers: [] });
  }
  return ok(res, await globalSearch(query));
}
