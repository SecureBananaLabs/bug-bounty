export function errorHandler(err, req, res, next) {
  if (!err.expose) {
    console.error("Unhandled API error:", err);
  }

  if (res.headersSent) {
    return next(err);
  }

  const status = Number.isInteger(err.status) ? err.status : 500;
  const message = err.expose ? err.message : "Unexpected server error";

  return res.status(status).json({
    success: false,
    message
  });
}
