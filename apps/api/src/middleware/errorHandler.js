import { fail } from "../utils/response.js";

/**
 * Central error handler.
 * FIX (issue #12327): ZodError from async route handlers crashed the process —
 * Express 4 does not catch rejected promises from async handlers automatically.
 * We now detect Zod-style validation failures (err.issues / err.name === "ZodError")
 * and return a clean 400 instead of an unhandled crash + 500.
 */
export function errorHandler(err, req, res, next) {
  // Zod validation failure (thrown inside async handlers)
  if (err?.name === "ZodError" || Array.isArray(err?.issues)) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: (err.issues || []).map((i) => ({
        path: i.path?.join(".") ?? "",
        message: i.message
      }))
    });
  }

  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
