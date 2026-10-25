export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  // Handle Zod schema validation errors gracefully with HTTP 400
  if (err.name === "ZodError" || Array.isArray(err.issues)) {
    const formattedErrors = err.issues
      ? err.issues.map((i) => ({
          field: (i.path || []).join("."),
          message: i.message
        }))
      : [{ message: err.message }];

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formattedErrors
    });
  }

  // Handle SyntaxError (e.g. malformed JSON in request body)
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Malformed JSON payload"
    });
  }

  console.error("Unhandled API error:", err);

  return res.status(500).json({
    success: false,
    message: err.message || "Unexpected server error"
  });
}
