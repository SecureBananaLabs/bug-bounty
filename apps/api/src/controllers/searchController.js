import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const raw = (req.query.q ?? "").trim();
  // Sanitize search input - limit length, remove control chars
  const sanitized = raw.replace(/[\\x00-\\x1f\\x7f]/g, "").slice(0, 200);
  if (sanitized.length < 1) {
    return ok(res, { results: [], query: "" });
  }
  return ok(res, await globalSearch(sanitized));
}
