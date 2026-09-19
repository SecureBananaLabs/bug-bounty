export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err?.type === "entity.too.large" || err?.status === 413) {
    return res.status(413).json({
      success: false,
      message: "Request body too large"
    });
  }

  console.error("Unhandled API error:", err);
  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
