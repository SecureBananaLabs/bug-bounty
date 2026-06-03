import { ok, badRequest } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const query = req.query.q ?? "";
  
  // Validate and sanitize search query
  if (typeof query !== "string") {
    return badRequest(res, "Search query must be a string");
  }
  
  const trimmed = query.trim();
  
  // Length limit
  if (trimmed.length > 200) {
    return badRequest(res, "Search query must be 200 characters or less");
  }
  
  // Empty query check
  if (trimmed.length === 0) {
    return badRequest(res, "Search query cannot be empty");
  }
  
  // Sanitize - remove potentially dangerous characters
  const sanitized = trimmed.replace(/[<>]/g, "");
  
  return ok(res, await globalSearch(sanitized));
}
