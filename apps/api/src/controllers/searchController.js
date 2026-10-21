import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res, next) {
  try {
    const rawQ = req.query.q;

    if (rawQ !== undefined) {
      if (typeof rawQ !== "string") {
        return fail(res, "Search query must be a string", 400);
      }
      const trimmed = rawQ.trim();
      if (trimmed.length > 200) {
        return fail(res, "Search query cannot exceed 200 characters", 400);
      }
      return ok(res, await globalSearch(trimmed));
    }

    return ok(res, await globalSearch(""));
  } catch (err) {
    next(err);
  }
}
