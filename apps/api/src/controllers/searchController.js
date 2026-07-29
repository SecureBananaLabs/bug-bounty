import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const query = (req.query.q ?? "").trim().slice(0, 200);
  return ok(res, await globalSearch(query));
}
