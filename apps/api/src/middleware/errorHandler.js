export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  if (typeof err?.status === "number") {
    return res.status(err.status).json({
      success: false,
      message: err.message ?? "Request failed"
    });
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
