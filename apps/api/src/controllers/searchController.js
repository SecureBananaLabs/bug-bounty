import { badRequest } from "../utils/response.js";
import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

function validateAndSanitizeQuery(query) {
  if (typeof query !== 'string') {
    return { valid: false, message: "Query must be a string" };
  }
  if (Array.isArray(query)) {
    return { valid: false, message: "Query cannot be an array" };
  }
  query = query.trim();
  if (query.length > 200) {
    return { valid: false, message: "Query too long" };
  }
  return { valid: true, query: query };
}

export async function search(req, res) {
  const validation = validateAndSanitizeQuery(req.query.q);
  if (!validation.valid) {
    return badRequest(res, { message: "Invalid query parameter: " + validation.message });
  }
  const { query } = validation;
  return ok(res, await globalSearch(query));
}
