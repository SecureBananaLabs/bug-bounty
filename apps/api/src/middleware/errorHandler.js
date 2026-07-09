export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  // Handle Zod validation errors
  if (err.name === "ZodError" || err.constructor?.name === "ZodError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.errors
    });
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
