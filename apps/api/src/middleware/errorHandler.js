const SERVER_ERROR_MESSAGE = "Unexpected server error";

// Body parser failures arrive as SyntaxError with status 400; other handlers
// may set err.status/statusCode themselves. A client mistake must not be
// reported as a server error.
function resolveStatus(err) {
  for (const candidate of [err?.status, err?.statusCode]) {
    if (Number.isInteger(candidate) && candidate >= 400 && candidate <= 599) {
      return candidate;
    }
  }

  if (err instanceof SyntaxError && err?.type === "entity.parse.failed") {
    return 400;
  }

  return 500;
}

export function errorHandler(err, req, res, next) {
  const status = resolveStatus(err);

  if (status >= 500) {
    console.error("Unhandled API error:", err);
  }

  if (res.headersSent) {
    return next(err);
  }

  return res.status(status).json({
    success: false,
    message: status >= 500 ? SERVER_ERROR_MESSAGE : err?.message || "Bad request"
  });
}
