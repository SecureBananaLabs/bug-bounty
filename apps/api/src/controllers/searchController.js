import { ok, fail } from "../utils/response.js";
import { searchSchema } from "../validators/search.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  try {
    const params = searchSchema.parse(req.query);
    const result = await globalSearch(params);
    return ok(res, result);
  } catch (error) {
    if (error.name === "ZodError") {
      const issue = error.issues[0];
      return fail(res, issue ? issue.message : "Invalid search parameters", 400);
    }
    return fail(res, "Search processing error", 500);
  }
}
