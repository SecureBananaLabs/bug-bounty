import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

function normalizeSearchQuery(value) {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    const firstStringValue = value.find((entry) => typeof entry === "string");
    return firstStringValue ?? "";
  }

  return "";
}

export async function search(req, res) {
  return ok(res, await globalSearch(normalizeSearchQuery(req.query.q)));
}
