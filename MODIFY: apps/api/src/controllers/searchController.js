// MODIFY: apps/api/src/controllers/searchController.js (around line 4)
import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const query = req.query.q ?? ""; // FIX: extract query parameter
  if (typeof query !== 'string' || query.length > 100) { // FIX: validate input type and length
    return res.status(400).json({ error: 'Invalid search query' }); // FIX: return error for invalid input
  }
  return ok(res, await globalSearch(query));
}