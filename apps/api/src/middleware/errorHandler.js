// Body-parser error types that indicate client-sent malformed input
const CLIENT_ERROR_TYPES = [
  'entity.parse.failed',
  'entity.not.json',
  'entity.encoding.unsupported',
  'charset.not.supported',
  'encoding.unsupported',
];

/**
 * Shared API error middleware.
 * Returns 400 for malformed request bodies (JSON parse errors, etc.).
 * Returns 500 for unexpected server errors.
 */
export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  // Client-side errors: malformed request body
  if (CLIENT_ERROR_TYPES.includes(err.type)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request body. Please check your JSON syntax.',
    });
  }

  // Unexpected server error
  console.error("Unhandled API error:", err);
  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
