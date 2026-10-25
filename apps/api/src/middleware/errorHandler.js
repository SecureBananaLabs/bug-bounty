export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      message: "File too large"
    });
  }

  console.error("Unhandled API error:", err);

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
