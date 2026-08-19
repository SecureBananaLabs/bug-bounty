export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const isUnexpectedFile = err?.code === "LIMIT_UNEXPECTED_FILE";
  const status = isUnexpectedFile ? 400 : 500;

  if (status >= 500) {
    console.error("Unhandled API error:", err);
  }

  return res.status(status).json({
    success: false,
    message: isUnexpectedFile ? "Unexpected file field" : "Unexpected server error"
  });
}
