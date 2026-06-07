import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

/**
 * Validates the search query parameter before passing it to the service.
 * Prevents:
 *   - Missing or empty query from wasting resources
 *   - Excessively long queries from causing DoS (#2833)
 *   - Non-string queries from crashing the service
 */
function validateSearchQuery(raw) {
  if (raw === undefined || raw === null) {
    return { valid: false, error: "Missing required query parameter 'q'" };
  }

  if (typeof raw !== "string") {
    return { valid: false, error: "Query parameter 'q' must be a string" };
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: "Query parameter 'q' must not be empty" };
  }

  if (trimmed.length > MAX_QUERY_LENGTH) {
    return {
      valid: false,
      error: `Query parameter 'q' exceeds maximum length of ${MAX_QUERY_LENGTH} characters`,
    };
  }

  return { valid: true, value: trimmed };
}

export async function search(req, res) {
  const result = validateSearchQuery(req.query.q);
  if (!result.valid) {
    return fail(res, result.error, 400);
  }
  return ok(res, await globalSearch(result.value));
}
