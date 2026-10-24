export function errorHandler(err, req, res, next) {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    console.error("Unhandled API error:", {
      message: err?.message ? "Error occurred" : "Unknown error",
      name: err?.name || "Error",
      statusCode: err?.statusCode || 500,
      path: req?.path,
      method: req?.method,
      timestamp: new Date().toISOString()
    });
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
