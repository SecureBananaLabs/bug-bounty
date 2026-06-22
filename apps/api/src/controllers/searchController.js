import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const q = (req.query.q ?? "").trim();
  if (!q) {
    return res.status(400).json({ error: "Missing required query parameter: q" });
  }
  return ok(res, await globalSearch(q));
}
