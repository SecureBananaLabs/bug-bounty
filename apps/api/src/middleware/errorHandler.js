export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  // Use the error's status code if available (e.g., 400 for malformed JSON)
  const status = err.status || err.statusCode || 500;
  const message = status >= 500 ? "Unexpected server error" : (err.message || "Bad request");

  return res.status(status).json({
    success: false,
    message
  });
}
