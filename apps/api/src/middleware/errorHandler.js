export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const message =
    err.expose === true || statusCode < 500
      ? err.message
      : "Unexpected server error";

  return res.status(statusCode).json({
    success: false,
    message
  });
}
