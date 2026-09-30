export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  // Handle Multer errors (file upload validation)
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File too large. Maximum size is 5MB.",
    });
  }
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      success: false,
      message: "Unexpected file field.",
    });
  }
  if (err.message && err.message.startsWith("Invalid file type")) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Handle Zod validation errors
  if (err.name === "ZodError" || err.constructor?.name === "ZodError") {
    const issues = err.issues || [];
    const message = issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    return res.status(400).json({
      success: false,
      message: message || "Validation error",
    });
  }

  // Handle application errors with custom status codes
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error",
  });
}
