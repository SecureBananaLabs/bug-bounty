export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      code: "LIMIT_FILE_SIZE",
      message: "File size exceeds 5 MB limit"
    });
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
