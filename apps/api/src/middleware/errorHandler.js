export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  // Multer errors (file upload issues) → 400
  if (err.code && err.code.startsWith("LIMIT_")) {
    return res.status(400).json({
      success: false,
      message: err.message || "File upload error"
    });
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
