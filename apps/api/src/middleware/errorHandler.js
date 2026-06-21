export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  // Handle multer file size limit error
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      message: "File too large. Maximum size is 10 MB."
    });
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
