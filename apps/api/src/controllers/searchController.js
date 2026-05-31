import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;
const MAX_RESULTS = 100;

export async function search(req, res) {
  const query = (req.query.q ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  if (!query) {
    return ok(res, { results: [], query: "" });
  }
  const results = await globalSearch(query);
  return ok(res, { results: results.slice(0, MAX_RESULTS), query });
}
