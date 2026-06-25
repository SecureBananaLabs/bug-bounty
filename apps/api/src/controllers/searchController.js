import { ok } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  return ok(res, await globalSearch(req.query.q ?? ""));
}
iimport { z } from "zod";
import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const searchQuerySchema = z.string().trim().min(1).max(200);

export async function search(req, res) {
  const raw = req.query.q;

  if (typeof raw !== "string") {
    return fail(res, "Search query must be a single string", 400);
  }

  const result = searchQuerySchema.safeParse(raw);

  if (!result.success) {
    const message = raw.trim().length === 0
      ? "Search query must not be empty"
      : "Search query must be 200 characters or fewer";
    return fail(res, message, 400);
  }

  return ok(res, await globalSearch(result.data));
}
