import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";
import { searchQuerySchema } from "../validators/search.js";

export async function search(req, res) {
  const rawQuery = req.query.q ?? "";

  // Validate the query parameter
  const result = searchQuerySchema.safeParse(rawQuery);
  if (!result.success) {
    const issue = result.error.issues[0];
    return fail(res, issue.message, 400);
  }

  // Use the trimmed, validated query
  return ok(res, await globalSearch(result.data));
}