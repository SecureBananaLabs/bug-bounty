import { ZodError } from "zod";

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ZodError || err.name === "ZodError" || err.issues) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.issues || err.errors
    });
  }

  console.error("Unhandled API error:", err);

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
