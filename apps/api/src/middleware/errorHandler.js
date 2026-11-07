export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  return res.status(err.status ?? 500).json({
    success: false,
    message: err.status ? err.message : "Unexpected server error"
  });
}
