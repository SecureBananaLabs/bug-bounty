export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  const status = Number.isInteger(err.statusCode) ? err.statusCode : 500;
  return res.status(status).json({
    success: false,
    message: status === 500 ? "Unexpected server error" : err.message
  });
}
