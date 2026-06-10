import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

function isValidSearchQuery(query) {
  if (typeof query !== 'string') return false;
  if (query.length > 200) return false;
  return true;
}

export async function search(req, res) {
  const query = req.query.q ?? "";
  if (!isValidSearchQuery(query)) {
    return res.status(400).json({ error: "Invalid query parameter" });
  }
  return ok(res, await globalSearch(query.trim()));
}
