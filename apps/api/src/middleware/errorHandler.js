import { ZodError } from "zod";

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  // Schema violations are client errors: report 400 with the field paths so
  // the caller can correct the request.
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Invalid request body",
      errors: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    });
  }

  // Client errors (4xx) carry an explicit status set by the service layer.
  // Anything else is an unexpected failure and is logged, not leaked.
  const status = Number.isInteger(err?.status) && err.status >= 400 && err.status < 500
    ? err.status
    : 500;

  if (status === 500) {
    console.error("Unhandled API error:", err);
    return res.status(500).json({
      success: false,
      message: "Unexpected server error"
    });
  }

  return res.status(status).json({
    success: false,
    message: err.message || "Request failed"
  });
}
