export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);

  // Support custom status codes from thrown errors
  const statusCode = err.statusCode || 500;
  const message = err.message || "Unexpected server error";

  // Handle Zod validation errors
  if (err.name === "ZodError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.errors || err.issues || []
    });
  }

  if (res.headersSent) {
    return next(err);
  }

  return res.status(statusCode).json({
    success: false,
    message
  });
}
