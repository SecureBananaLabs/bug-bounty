import { ZodError } from "zod";
import { searchQuerySchema } from "../validators/search.js";
import { globalSearch } from "../services/searchService.js";
import { ok } from "../utils/response.js";

export async function search(req, res, next) {
  try {
    const validated = searchQuerySchema.parse(req.query);
    const result = await globalSearch(validated.q, {
      page: validated.page,
      limit: validated.limit
    });
    return ok(res, result);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: err.errors
      });
    }
    if (next) {
      return next(err);
    }
    throw err;
  }
}
