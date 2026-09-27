import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const raw = req.query.q;
  if (Array.isArray(raw)) {
    return fail(res, "Query parameter 'q' must be a single string", 400);
  }
  const q = typeof raw === "string" ? raw.trim().slice(0, 200) : "";
  return ok(res, await globalSearch(q));
}
