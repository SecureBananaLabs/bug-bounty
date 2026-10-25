export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  // Handle malformed JSON (body-parser parse errors)
  if (err.type === 'entity.parse.failed' || err.status === 400) {
    console.warn("Malformed JSON request:", err.message);
    return res.status(400).json({
      success: false,
      message: "Malformed JSON in request body"
    });
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError' && err.issues) {
    console.warn("Validation error:", err.issues);
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      issues: err.issues
    });
  }

  // Generic server error
  console.error("Unhandled API error:", err);
  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
