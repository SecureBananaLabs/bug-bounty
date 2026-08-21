export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  if (err.issues) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: err.issues
    });
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
