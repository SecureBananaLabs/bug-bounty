export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  const hasStatus = Number.isInteger(err.statusCode);
  const status = hasStatus ? err.statusCode : 500;

  return res.status(status).json({
    success: false,
    message: hasStatus ? err.message || "Unexpected server error" : "Unexpected server error"
  });
}
