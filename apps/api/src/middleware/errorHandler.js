export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err.status) {
    return res.status(err.status).json({
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
