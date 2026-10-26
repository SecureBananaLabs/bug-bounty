export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err?.statusCode && err?.message) {
    if (err.statusCode >= 500) {
      console.error("API error:", err);
    }

    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  console.error("Unhandled API error:", err);
  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
