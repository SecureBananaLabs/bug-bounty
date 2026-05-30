export function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV === "development") { console.error("Unhandled API error:", err); }
  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
