import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const query = req.query.q;
  if (!query || typeof query !== 'string' || query.trim() === '') {
    return res.status(400).json({
      success: false,
      message: "Query parameter 'q' is required and cannot be empty."
    });
  }
  return ok(res, await globalSearch(query.trim()));
}
