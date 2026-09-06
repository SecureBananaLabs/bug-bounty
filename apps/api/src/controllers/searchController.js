import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

export async function search(req, res) {
  const raw = (req.query.q ?? "").trim();
  if (!raw) {
    return res.status(400).json({ error: "query parameter q is required" });
  }
  if (raw.length > MAX_QUERY_LENGTH) {
    return res.status(400).json({ error: `query too long (max ${MAX_QUERY_LENGTH} characters)` });
  }
  // Strip control characters and normalize whitespace
  const sanitized = raw.replace(/[\x00-\x1f\x7f]/g, "").trim();
  return ok(res, await globalSearch(sanitized));
}
