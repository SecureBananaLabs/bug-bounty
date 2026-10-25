export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err?.name === "MulterError") {
    const isTooLarge = err.code === "LIMIT_FILE_SIZE";

    return res.status(isTooLarge ? 413 : 400).json({
      success: false,
      message: isTooLarge ? "File exceeds the 5 MB upload limit" : "Invalid file upload"
    });
  }

  console.error("Unhandled API error:", err);

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
