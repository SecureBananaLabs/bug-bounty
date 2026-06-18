import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

export async function search(req, res) {
  const q = req.query.q ?? "";

  if (typeof q !== "string") {
    return res.status(400).json({ error: "Query parameter 'q' must be a string." });
  }

  const trimmed = q.trim();

  if (trimmed.length > MAX_QUERY_LENGTH) {
    return res.status(400).json({
      error: `Query parameter 'q' must not exceed ${MAX_QUERY_LENGTH} characters.`,
    });
  }

  return ok(res, await globalSearch(trimmed));
}
