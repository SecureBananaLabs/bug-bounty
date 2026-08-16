import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 256;

export async function search(req, res) {
  const q = (req.query.q ?? "").trim();
  
  if (q.length > MAX_QUERY_LENGTH) {
    return fail(res, `Query too long. Maximum length is ${MAX_QUERY_LENGTH} characters.`, 400);
  }

  return ok(res, await globalSearch(q));
}
