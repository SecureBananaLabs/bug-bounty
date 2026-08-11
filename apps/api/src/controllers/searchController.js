import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const q = req.query.q ?? "";
  if (q.length > 200) {
    return res.status(400).json({ error: "Search query too long" });
  }
  return ok(res, await globalSearch(q));
}
