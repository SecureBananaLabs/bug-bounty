import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

function validateSearchQuery(rawQuery) {
  if (typeof rawQuery !== "string") {
    return { valid: false, error: "Query must be a single string" };
  }

  const trimmed = rawQuery.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: "Query cannot be empty" };
  }

  if (trimmed.length > 200) {
    return { valid: false, error: "Query exceeds maximum length of 200 characters" };
  }

  return { valid: true, query: trimmed };
}

export async function search(req, res) {
  const validation = validateSearchQuery(req.query.q);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }
  return ok(res, await globalSearch(validation.query));
}
