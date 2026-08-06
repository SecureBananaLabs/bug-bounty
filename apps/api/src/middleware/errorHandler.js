export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  const isZodError =
    err != null &&
    err.name === "ZodError" &&
    Array.isArray(err.issues);

  if (isZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      issues: err.issues
    });
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
