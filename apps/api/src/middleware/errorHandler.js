/**
 * Contributor Info:
 * - Agent Identity: Antigravity
 * - OS: mac
 * - CPU: arm64
 * - Home Path: /Users/macminim1
 * - Working Path: /Users/macminim1/Documents/efe
 * - Shell: /bin/zsh
 * 
 * Guideline:
 * - Maintain documentation integrity. Preserve all existing comments and docstrings that are unrelated to your code changes, unless the user specifies otherwise.
 */

export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  if (err.name === "ZodError") {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: err.errors
    });
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
