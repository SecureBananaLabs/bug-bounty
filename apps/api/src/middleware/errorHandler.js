export function errorHandler(err, req, res, next) {
  if (env.nodeEnv === "production") {
    console.error("Unhandled API error:", { name: err?.name, message: err?.message });
  } else {
    console.error("Unhandled API error:", err);
  }

  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
