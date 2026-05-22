export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode ?? 500;

  return res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 && !err.statusCode ? "Unexpected server error" : err.message
  });
}
