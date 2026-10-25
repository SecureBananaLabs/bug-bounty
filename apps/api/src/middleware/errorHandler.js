import multer from "multer";
import { fail } from "../utils/response.js";

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return fail(res, "Uploaded file too large", 413);
  }

  console.error("Unhandled API error:", err);

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
