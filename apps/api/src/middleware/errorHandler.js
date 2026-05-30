// Fix #1469: Enhanced error handler with ZodError support
export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);

  if (res.headersSent) {
    return next(err);
  }

  // Fix #1469: Handle Zod validation errors with proper 400 status
  if (err.name === "ZodError") {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: err.errors.map(e => ({
        field: e.path.join("."),
        message: e.message
      }))
    });
  }

  // Handle our custom application errors
  if (err.message) {
    // Distinguish between client errors (4xx) and server errors (5xx)
    const clientErrors = [
      "Invalid email or password",
      "Missing required fields",
      "Refresh token is required",
      "Invalid or expired refresh token",
      "User already exists"
    ];
    if (clientErrors.some(msg => err.message.includes(msg))) {
      return res.status(401).json({
        success: false,
        message: err.message
      });
    }
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
