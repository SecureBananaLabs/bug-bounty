import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";
import { createError } from "../utils/error.js";

export async function search(req, res) {
  const query = req.query.q;
  
  // Validate that query is a string and not an array
  if (Array.isArray(query)) {
    return res.status(400).json({ error: "Invalid query parameter: query must be a string" });
  }
  
  // Check if query is provided and is a string
  if (query === undefined || query === null) {
    // If no query, search with empty string
    return ok(res, await globalSearch(""));
  }
  
  if (typeof query !== 'string') {
    return res.status(400).json({ error: "Invalid query parameter: query must be a string" });
  }
  
  // Trim and validate length
  const trimmedQuery = query.trim();
  if (trimmedQuery.length > 200) {
    return res.status(400).json({ error: "Query exceeds maximum length of 200 characters" });
  }
  
  // If validation passes, proceed with search
  return ok(res, await globalSearch(trimmedQuery));
}
