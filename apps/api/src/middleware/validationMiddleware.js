import { fail } from "../utils/response.js";
import { ZodError } from "zod";

export function validateSchema(schema) {
  return async (req, res, next) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return fail(res, "Validation Error", 400, error.errors);
      }
      return fail(res, "Internal Server Error", 500);
    }
  };
}
