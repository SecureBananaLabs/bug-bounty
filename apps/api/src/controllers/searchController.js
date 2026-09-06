import { ok, badRequest } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const q = req.query.q;

  if (q !== undefined && typeof q !== "string") {
    return badRequest(res, "Query parameter 'q' must be a string.");
  }

  const trimmed = (q ?? "").trim();

  if (trimmed.length > 200) {
    return badRequest(res, "Query parameter 'q' must not exceed 200 characters.");
  }

  return ok(res, await globalSearch(trimmed));
}
