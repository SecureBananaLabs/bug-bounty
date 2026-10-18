export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const isZodError = err?.name === "ZodError";
  const status = isZodError ? 400 : 500;

  if (status >= 500) {
    console.error("Unhandled API error:", err);
  }

  return res.status(status).json({
    success: false,
    message: isZodError ? "Invalid request" : "Unexpected server error"
  });
}
