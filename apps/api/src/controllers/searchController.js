import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

export async function search(req, res, next) {
  try {
    const q = req.query.q;

    if (!q || typeof q !== "string" || q.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Query parameter 'q' is required and cannot be blank"
      });
    }

    if (q.length > MAX_QUERY_LENGTH) {
      return res.status(400).json({
        success: false,
        error: `Query parameter 'q' exceeds maximum length of ${MAX_QUERY_LENGTH} characters`
      });
    }

    return ok(res, await globalSearch(q));
  } catch (error) {
    next(error);
  }
}
