export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = Number.isInteger(err.statusCode) ? err.statusCode : 500;

  return res.status(statusCode).json({
    success: false,
    message: err.expose ? err.message : "Unexpected server error"
  });
}
