export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  if (err.type === "charset.unsupported" || err.type === "encoding.unsupported") {
    return res.status(415).json({
      success: false,
      message: "Unsupported media type"
    });
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
