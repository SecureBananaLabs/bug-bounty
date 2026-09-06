import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const query = (req.query.q ?? "").toString().slice(0, 200);
  if (!query.trim()) {
    return res.status(400).json({ error: "Search query is required" });
  }
  return ok(res, await globalSearch(query));
}
