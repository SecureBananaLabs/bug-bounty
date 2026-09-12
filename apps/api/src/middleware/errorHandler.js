export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.statusCode ?? 500;

  if (status >= 500) {
    console.error("Unhandled API error:", err);
  }

  return res.status(status).json({
    success: false,
    message: status >= 500 ? "Unexpected server error" : err.message
  });
}
