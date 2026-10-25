export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err.name === "ZodError") {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: err.errors
    });
  }

  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    console.error("Unhandled API error:", err);
  }

  return res.status(status).json({
    success: false,
    message: err.message || "Unexpected server error"
  });
}
