const unsupportedMediaTypeMessages = {
  "charset.unsupported": "Unsupported request charset",
  "encoding.unsupported": "Unsupported content encoding"
};

export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  const unsupportedMediaTypeMessage = unsupportedMediaTypeMessages[err?.type];
  if (err?.status === 415 && unsupportedMediaTypeMessage) {
    return res.status(415).json({
      success: false,
      message: unsupportedMediaTypeMessage
    });
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
