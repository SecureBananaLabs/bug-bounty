export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  if (err.status) {
    return res.status(err.status).json({ success: false, message: err.message });
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
