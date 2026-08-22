import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  let q = req.query.q ?? "";
  if (typeof q !== "string") q = String(q);
  q = q.replace(/[\x00-\x1F\x7F]/g, "").trim().slice(0, 200);
  return ok(res, await globalSearch(q));
}
