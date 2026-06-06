/**
 * Express middleware factory that validates req.body against a Zod schema.
 * Returns 400 with structured errors on validation failure.
 */
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      });
    }
    req.validatedBody = result.data;
    next();
  };
}
