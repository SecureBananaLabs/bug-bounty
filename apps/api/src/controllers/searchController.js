import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().max(100, { message: "Query too long, max 100 chars" })
});

export async function search(req, res) {
  try {
    const { q } = searchSchema.parse(req.query);
    return ok(res, await globalSearch(q));
  } catch (e) {
    return fail(res, e.message, 400);
  }
}
