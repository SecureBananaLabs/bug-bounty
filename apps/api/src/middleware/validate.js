/**
 * Generic Zod validation middleware.
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against.
 */
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return res.status(400).json({ errors });
    }
    req.body = result.data;
    next();
  };
}
