import multer from "multer";

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_UNEXPECTED_FILE" ? "Unexpected file field" : "Invalid upload";

    return res.status(400).json({
      success: false,
      message
    });
  }

  console.error("Unhandled API error:", err);
  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
