const { ZodError } = require('zod');

/**
 * Middleware factory that validates request body against a Zod schema.
 * On success, replaces req.body with the parsed (and possibly transformed) data.
 * On failure, returns a 400 JSON response with validation error details.
 *
 * @param {import('zod').ZodSchema} schema
 * @returns {import('express').RequestHandler}
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
          path: e.path.join('.') || '_root',
          message: e.message,
        }));
        return res.status(400).json({ error: 'Validation failed', details: errors });
      }
      next(err);
    }
  };
}

module.exports = { validate };
