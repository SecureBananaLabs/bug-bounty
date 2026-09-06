import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const query = req.query.q;

  // Validate query is a string
  if (typeof query !== "string") {
    return res.status(400).json({
      error: "Search query must be a string"
    });
  }

  // Trim and validate length
  const trimmedQuery = query.trim();

  if (trimmedQuery.length > 200) {
    return res.status(400).json({
      error: "Search query must be 200 characters or less"
    });
  }

  return ok(res, await globalSearch(trimmedQuery));
}
