import { ZodError } from "zod";

export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message
    }));
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors
    });
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
