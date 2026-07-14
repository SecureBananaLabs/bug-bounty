export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  const status = err.statusCode ?? err.status;
  const isUnsupportedMediaError =
    status === 415 &&
    (err.type === "charset.unsupported" || err.type === "encoding.unsupported");

  if (isUnsupportedMediaError) {
    return res.status(415).json({
      success: false,
      message: "Unsupported media type"
    });
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
