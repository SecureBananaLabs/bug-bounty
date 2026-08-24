import multer from "multer";
import { ZodError } from "zod";

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof multer.MulterError || err?.name === "MulterError") {
    return res.status(400).json({
      success: false,
      message: err.message || "Invalid multipart upload payload"
    });
  }

  if (err instanceof ZodError || err?.name === "ZodError") {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: typeof err.flatten === "function" ? err.flatten().fieldErrors : err.errors
    });
  }

  console.error("Unhandled API error:", err);

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
