export function errorHandler(err, req, res, next) {
  console.error("API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  // Malformed JSON body — return 400
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON in request body"
    });
  }

  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.statusCode ? err.message : "Unexpected server error"
  });
}
