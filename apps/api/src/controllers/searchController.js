import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

function normalizeSearchQuery(value) {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    const firstString = value.find((item) => typeof item === "string");
    return firstString ?? "";
  }

  return "";
}

export async function search(req, res) {
  return ok(res, await globalSearch(normalizeSearchQuery(req.query.q)));
}
