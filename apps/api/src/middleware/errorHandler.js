export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode =
    Number.isInteger(err.statusCode) && err.statusCode >= 400
      ? err.statusCode
      : 500;
  const message =
    err.expose && err.message ? err.message : "Unexpected server error";

  if (!err.expose) {
    console.error("Unhandled API error:", err);
  }

  return res.status(statusCode).json({
    success: false,
    message
  });
}
