export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  // Handle malformed JSON body (body-parser SyntaxError)
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Malformed JSON in request body"
    });
  }

  // Handle oversized JSON body (body-parser entity.too.large)
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request body too large"
    });
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
