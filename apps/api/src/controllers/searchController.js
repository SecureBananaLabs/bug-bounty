import { ok, fail } from "../utils/response.js";
import { z } from "zod";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const schema = z.object({
    q: z.string().trim().min(1, "Search query is required").max(128, "Search query is too long"),
  });

  try {
    const payload = schema.parse(req.query);
    return ok(res, await globalSearch(payload.q));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(res, error.errors[0]?.message ?? "Invalid search query", 400);
    }
    return fail(res, "Invalid search query", 400);
  }
}
