export function isMalformedJsonError(err) {
  if (!err || typeof err !== "object") {
    return false;
  }
  if (err.type === "entity.parse.failed") {
    return true;
  }
  const status = err.status ?? err.statusCode;
  return err instanceof SyntaxError && status === 400 && "body" in err;
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (isMalformedJsonError(err)) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON payload"
    });
  }

  console.error("Unhandled API error:", err);
  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
