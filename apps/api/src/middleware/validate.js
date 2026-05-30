import { ZodError } from "zod";
import { fail } from "../utils/response.js";

/**
 * Middleware factory: validates req.query against a Zod schema.
 * On success, replaces req.query with the parsed (and default-filled) result.
 * On failure, responds 400 with the first error message.
 */
export function validateQuery(schema) {
  return (req, res, next) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.errors[0]?.message ?? "Invalid query parameters";
        return fail(res, message, 400);
      }
      return fail(res, "Invalid query parameters", 400);
    }
  };
}
