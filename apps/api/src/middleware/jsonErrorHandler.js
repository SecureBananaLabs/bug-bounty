export function jsonErrorHandler(err, req, res, next) {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON payload"
    });
  }

  return next(err);
}
