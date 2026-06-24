import { ZodError } from "zod";

export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      issues: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message
      }))
    });
  }

  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
