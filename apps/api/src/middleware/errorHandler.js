import { ZodError } from "zod";

export function errorHandler(err, req, res, next) {
  const errorSummary =
    err instanceof Error
      ? {
          name: err.name,
          message: err.message,
          stack: err.stack
        }
      : {
          message: String(err)
        };

  console.error("Unhandled API error:", errorSummary);
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.issues.map((issue) => ({
        path: issue.path.join("."),
        code: issue.code,
        message: issue.message
      }))
    });
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
