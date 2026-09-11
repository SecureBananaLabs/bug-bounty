export function errorHandler(err, req, res, next) {
  // Zod validation errors -> 400 with field details
  if (err?.errors?.length) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.errors.map(({ path, message }) => ({ path: path.join("."), message }))
    });
  }
  // Domain errors carry an explicit status (e.g. 401 from bad credentials)
  if (err?.status && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ success: false, message: err.message });
  }
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }
  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
