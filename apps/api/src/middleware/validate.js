import { ZodError } from "zod";
import { fail } from "../utils/response.js";

export function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ");
        return fail(res, `Validation failed: ${details}`, 400);
      }
      return next(error);
    }
  };
}
