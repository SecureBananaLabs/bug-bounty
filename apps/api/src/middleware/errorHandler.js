const unsupportedMediaTypes = new Set([
  "charset.unsupported",
  "encoding.unsupported"
]);

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err?.status === 415 && unsupportedMediaTypes.has(err?.type)) {
    return res.status(415).json({
      success: false,
      message: "Unsupported media type"
    });
  }

  console.error("Unhandled API error:", err);
  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
