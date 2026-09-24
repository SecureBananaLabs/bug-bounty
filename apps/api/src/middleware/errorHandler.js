export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err?.name ?? "Error");
  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
