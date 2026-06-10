import { badRequest } from "../utils/response.js";
import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

function validateSearchQuery(query) {
  // Check if query is a string
  if (typeof query !== 'string') {
    return { isValid: false, error: 'Search query must be a string' };
  }

  // Trim whitespace
  let trimmedQuery = query.trim();

  // Check length
  if (trimmedQuery.length > 200) {
    return { isValid: false, error: 'Search query exceeds maximum length of 200 characters' };
  }

  // Basic sanitization (removing potentially harmful characters)
  // Here we just return the trimmed query as it's already been length-checked
  // In a more comprehensive solution, you might want to strip special characters or apply other rules
  return { 
    isValid: true, 
    sanitizedQuery: trimmedQuery
  };
}

export async function search(req, res) {
  const query = req.query.q ?? "";
  const validation = validateSearchQuery(query);
  
  if (!validation.isValid) {
    return badRequest(res, { error: validation.error });
  }
  
  return ok(res, await globalSearch(validation.sanitizedQuery));
}
