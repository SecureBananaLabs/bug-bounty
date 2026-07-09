export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  // Handle body-parser oversized payload errors
  if (err.type === "entity.too.large" || err.status === 413) {
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
