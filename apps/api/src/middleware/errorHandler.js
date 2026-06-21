export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || err.statusCode || 500;
  
  // Only log unexpected server errors (500)
  if (statusCode === 500) {
    console.error("Unhandled API error:", err);
  }

  return res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? "Unexpected server error" : err.message
  });
}
