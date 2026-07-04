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

  // Handle explicit status errors (e.g. 409 Conflict, 400 Bad Request, 413 Payload Too Large)
  const status = err.status || err.statusCode;
  if (status && status >= 400 && status < 500) {
    return res.status(status).json({
      success: false,
      message: err.message || "Client error"
    });
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
