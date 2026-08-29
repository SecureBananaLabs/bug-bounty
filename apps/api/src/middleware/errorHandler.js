export function errorHandler(err, req, res, next) {
  // In production, avoid logging raw error objects which may contain:
  //  - Stack traces (expose internal file paths and line numbers)
  //  - SQL query text (expose table/column names and query structure)
  //  - Internal module paths (aid in targeted attacks)
  // Log a sanitized summary in production; keep full details in dev/test.
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) {
    console.error("Unhandled API error:", err?.message ?? "Unknown error", {
      path: req.path,
      method: req.method,
      status: err?.status ?? 500
    });
  } else {
    console.error("Unhandled API error:", err);
  }

  if (res.headersSent) {
    return next(err);
  }

  const status = (Number.isInteger(err?.status) && err.status >= 400 && err.status < 600)
    ? err.status
    : 500;

  return res.status(status).json({
    success: false,
    message: "Unexpected server error"
  });
}

