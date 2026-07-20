import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const query = req.query.q;
  if (!query || typeof query !== 'string' || query.trim().length === 0 || query.length > 100) {
    return res.status(400).json({ error: "Invalid search query" });
  }
  return ok(res, await globalSearch(query));
}
