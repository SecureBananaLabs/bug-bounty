export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  // A rejected body is the caller's mistake, so it is reported as a 400 that
  // names the offending fields instead of a generic server error.
  if (Array.isArray(err?.issues)) {
    const message = err.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    return res.status(400).json({ success: false, message });
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
