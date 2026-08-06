export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  if (err.name === "ZodError") {
    return res.status(422).json({
      success: false,
      message: "Validation error",
      errors: err.issues.map(i => ({ path: i.path.join("."), message: i.message }))
    });
  }

  if (err.name === "AuthenticationError") {
    return res.status(err.status || 401).json({
      success: false,
      message: err.message
    });
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
