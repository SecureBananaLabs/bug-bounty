import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

export async function search(req, res) {
  const query = req.query.q ?? "";
  if (query.length > MAX_QUERY_LENGTH) {
    return res.status(400).json({
      success: false,
      message: "Query too long (max " + MAX_QUERY_LENGTH + ")"
    });
  }
  return ok(res, await globalSearch(query));
}
