import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

function normalizeSearchQuery(value) {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : "";
  }

  return typeof value === "string" ? value : "";
}

export async function search(req, res) {
  return ok(res, await globalSearch(normalizeSearchQuery(req.query.q)));
}
