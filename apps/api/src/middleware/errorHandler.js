export function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV === "production") {
    console.error("Unhandled API error:", { name: err?.name ?? "Error" });
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
