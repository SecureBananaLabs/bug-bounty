export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err?.type === "entity.too.large" || err?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      message: "Request body too large"
    });
  }

  if (err?.status) {
    return res.status(err.status).json({
      success: false,
      message: err.message
    });
  }

  // ZodError: duck-typing for ESM module identity safety
  if (Array.isArray(err?.issues) && err?.name === "ZodError") {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: err.issues
    });
  }

  console.error("Unhandled API error:", err);
  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
