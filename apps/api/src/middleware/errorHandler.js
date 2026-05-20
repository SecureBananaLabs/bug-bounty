export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = Number.isInteger(err.statusCode) ? err.statusCode : 500;
  if (statusCode >= 500) {
    console.error("Unhandled API error:", err);
  }

  return res.status(statusCode).json({
    success: false,
    message: err.message ?? "Unexpected server error"
  });
}
