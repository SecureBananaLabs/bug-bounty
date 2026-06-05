import { ZodError } from "zod";

export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: err.errors[0].message
    });
  }

  const status = typeof err.status === "number" ? err.status : 500;
  const message = status === 500 ? "Unexpected server error" : err.message;
  return res.status(status).json({ success: false, message });
}
