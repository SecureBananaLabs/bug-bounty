export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || err.statusCode || (err.message === "Not allowed by CORS" ? 403 : 500);
  return res.status(status).json({
    success: false,
    message: err.message || "Unexpected server error"
  });
}
