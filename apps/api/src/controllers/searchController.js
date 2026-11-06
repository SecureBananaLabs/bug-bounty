import { ok, fail } from "../utils/response.js";
import { searchQuerySchema } from "../validators/search.js";
import { globalSearch } from "../services/searchService.js";
import { ZodError } from "zod";

export async function search(req, res) {
  try {
    const validated = searchQuerySchema.parse(req.query);
    const result = await globalSearch(validated);
    return ok(res, result);
  } catch (err) {
    if (err instanceof ZodError) {
      return fail(res, err.errors.map((e) => e.message).join(", "), 400);
    }
    throw err;
  }
}
