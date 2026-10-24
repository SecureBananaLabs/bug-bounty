export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  // The body parser signals an oversized payload with `entity.too.large`;
  // that is a client error, so it must not be flattened into a 500.
  if (err && err.type === "entity.too.large") {
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
