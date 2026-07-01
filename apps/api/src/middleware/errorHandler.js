export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);

  if (res.headersSent) {
    return next(err);
  }

  // Handle Zod/validation errors specifically if needed in the future
  // For now, provide a consistent structure
  const statusCode = err.status || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || "Unexpected server error"
  });
}
