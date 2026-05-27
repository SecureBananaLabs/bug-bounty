export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof SyntaxError && err.status === 400 && err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Malformed JSON request body"
    });
  }

  console.error("Unhandled API error:", err);
  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
