import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const query = (req.query.q ?? "").trim();
  if (query.length > 200) {
    return res.status(400).json({ error: "Bad Request", message: "Search query must be 200 characters or fewer" });
  }
  return ok(res, await globalSearch(query));
}
