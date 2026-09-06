import multer from "multer";
import { ZodError } from "zod";

export function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File too large — maximum size is 5 MB"
        : `Upload error: ${err.message}`;
    return res.status(400).json({ success: false, message });
  }

  if (err instanceof ZodError) {
    const message = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
    return res.status(400).json({ success: false, message });
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
