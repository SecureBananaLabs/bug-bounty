import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res, next) {
  try {
    const rawQuery = req.query.q ?? "";
    if (typeof rawQuery !== "string") {
      return res.status(400).json({
        success: false,
        message: "Search query must be a string"
      });
    }

    if (rawQuery.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Search query must not exceed 200 characters"
      });
    }

    const results = await globalSearch(rawQuery);
    return ok(res, results);
  } catch (err) {
    next(err);
  }
}
