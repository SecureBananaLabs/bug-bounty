import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const rawQuery = req.query.q ?? "";
  const sanitized = String(rawQuery).trim().substring(0, 100);
  return ok(res, await globalSearch(sanitized));
}
