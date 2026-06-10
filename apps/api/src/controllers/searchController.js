import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";
import { badRequest } from "../utils/response.js";
import { validate as validateQuery } from "../utils/validator.js";

function isValidSearchQuery(query) {
  if (typeof query !== 'string') {
    return false;
  }
  const trimmed = query.trim();
  if (trimmed.length === 0 || trimmed.length > 200) {
    return false;
  }
  return true;
}

export async function search(req, res) {
  const query = req.query.q;
  if (!isValidSearchQuery(query)) return badRequest(res, 'Invalid search query');
  return ok(res, await globalSearch(query.trim()));
}
