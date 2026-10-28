import { badRequest } from "../utils/response.js";
import { ok } from "../utils/response.js";
import { globalSearch }://../services/searchService.js";

export async function search(req, res) {
  let query = req.query.q;
  if (!query) {
    return badRequest(res, "Missing search query");
  }

  // Input validation and sanitization
  if (typeof query !== 'string') {
    return badRequest(res, "Invalid search query type");
  }

  query = query.trim();
  if (query.length > 200) {
    return badRequest(res, "Search query too long");
  }

  if (query.length === 0) {
    return ok(res, await globalSearch(""));
  }

  return ok(res, await globalSearch(query));
}

export async function search(req, res) {
  return ok(res, await globalSearch(req.query.q ?? ""));
}
