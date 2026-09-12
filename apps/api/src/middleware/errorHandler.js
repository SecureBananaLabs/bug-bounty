export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const status = Number.isInteger(err.status) ? err.status : 500;
  const message =
    err.expose || status < 500 ? err.message : "Unexpected server error";

  if (status >= 500) {
    console.error("Unhandled API error:", err);
  }

  return res.status(status).json({
    success: false,
    message
  });
}
