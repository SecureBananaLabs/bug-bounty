export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);

  if (res.headersSent) {
    return next(err);
  }

  // Handle Zod validation errors
  if (err.name === "ZodError" || Array.isArray(err.errors)) {
    const messages = err.errors?.map((e) => e.message).join(", ") ?? "Validation failed";
    return res.status(422).json({
      success: false,
      message: `Validation error: ${messages}`,
      errors: err.errors ?? [],
    });
  }

  // Handle known operational errors with status codes
  if (err.status && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
    });
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
    });
  }

  // Generic server error
  return res.status(500).json({
    success: false,
    message: "Unexpected server error",
  });
}
