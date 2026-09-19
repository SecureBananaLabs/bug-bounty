import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export function normalizeSearchQuery(value) {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : "";
  }

  return "";
}

export async function search(req, res) {
  return ok(res, await globalSearch(normalizeSearchQuery(req.query.q)));
}
