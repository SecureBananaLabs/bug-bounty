export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  // Handle malformed JSON parse errors from body-parser
  if (err?.type === "entity.parse.failed" || err?.type === "entity.too.large") {
    return res.status(400).json({
      success: false,
      message: err?.type === "entity.too.large" ? "Request body too large" : "Malformed JSON in request body"
    });
  }

  // Handle Multer file size limit errors
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
