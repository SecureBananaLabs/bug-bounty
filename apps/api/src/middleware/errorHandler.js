export function errorHandler(err, req, res, next) {
  // In production, never log raw error objects — they contain stack traces,
  // file paths, and internal state that can expose infrastructure details.
  if (process.env.NODE_ENV !== "production") {
    console.error("Unhandled API error:", err);
  } else {
    console.error("Unhandled API error:", err?.message ?? "unknown");
  }

  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}

