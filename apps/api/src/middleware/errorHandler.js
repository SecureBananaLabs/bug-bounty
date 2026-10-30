export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  // Handle express.json / body-parser parse failure
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: "Malformed JSON request body"
    });
  }

  // Handle express.json / body-parser too large failure
  if (err.status === 413 || err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request entity too large"
    });
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}

