import { fail } from "../utils/response.js";

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues.map((i) => i.message).join("; ");
      return fail(res, message, 400);
    }
    req.body = result.data;
    next();
  };
}
