import { fail, ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const query = (req.query.q ?? "").trim();
  
  if (query.length > 200) {
    return fail(res, "Search query must be 200 characters or less", 400);
  }
  
  return ok(res, await globalSearch(query));
}
