export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  // A rejected body is the caller's mistake, not a server fault, so it has to
  // come back as a 400 with the offending fields instead of a generic 500.
  if (err?.name === "ZodError" && Array.isArray(err.issues)) {
    const details = err.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    return res.status(400).json({ success: false, message: details });
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
