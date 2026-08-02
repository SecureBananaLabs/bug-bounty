import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().min(1, "query required").max(200, "query too long"),
});

export async function search(req, res) {
  const parsed = searchSchema.safeParse(req.query);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0].message, 400);
  }
  return ok(res, await globalSearch(parsed.data.q));
}