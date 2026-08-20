import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 500;

export async function search(req, res) {
  const raw = req.query.q;
  const q = typeof raw === "string" ? raw.trim() : "";
  if (q.length > MAX_QUERY_LENGTH) {
    return res.status(400).json({ success: false, message: "Query too long" });
  }
  return ok(res, await globalSearch(q));
}
