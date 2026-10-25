import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;
const ALLOWED_PATTERN = /^[a-zA-Z0-9\s\-_.@+]+$/;

export async function search(req, res) {
  const query = req.query.q ?? "";
  
  // Validate query is a string
  if (typeof query !== "string") {
    return res.status(400).json({ error: "Invalid search query" });
  }
  
  // Trim the query
  const trimmedQuery = query.trim();
  
  // Check if empty
  if (trimmedQuery.length === 0) {
    return res.status(400).json({ error: "Search query cannot be empty" });
  }
  
  // Check maximum length
  if (trimmedQuery.length > MAX_QUERY_LENGTH) {
    return res.status(400).json({ 
      error: `Search query must not exceed ${MAX_QUERY_LENGTH} characters` 
    });
  }
  
  // Check for invalid characters
  if (!ALLOWED_PATTERN.test(trimmedQuery)) {
    return res.status(400).json({ 
      error: "Search query contains invalid characters" 
    });
  }
  
  return ok(res, await globalSearch(trimmedQuery));
  }
