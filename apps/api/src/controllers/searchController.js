import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";
import { searchQuerySchema } from "../validators/search.js";

export async function search(req, res) {
  const result = searchQuerySchema.safeParse(req.query);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid search query",
      issues: result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    });
  }

  return ok(res, await globalSearch(result.data.q));
}
