import "express-async-errors";
import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  return ok(res, await globalSearch(req.query.q ?? ""));
}
