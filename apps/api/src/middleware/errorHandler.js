import multer from "multer";

export function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File too large — maximum size is 5 MB"
        : `Upload error: ${err.message}`;
    return res.status(400).json({ success: false, message });
  }

  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
