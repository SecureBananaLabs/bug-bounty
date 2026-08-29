import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";
import { searchSchema } from "../validators/search.js";

export async function search(req, res) {
  const result = searchSchema.safeParse(req.query);
  
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid search query",
      errors: result.error.errors
    });
  }

  return ok(res, await globalSearch(result.data.q));
}
