export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const message = statusCode >= 500 ? "Unexpected server error" : err.message;

  return res.status(statusCode).json({
    success: false,
    message
  });
}
