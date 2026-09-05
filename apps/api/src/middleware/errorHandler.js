export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  if (err?.type === "entity.parse.failed" && err?.status === 400) {
    return res.status(400).json({
      success: false,
      message: "Malformed JSON request body"
    });
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
