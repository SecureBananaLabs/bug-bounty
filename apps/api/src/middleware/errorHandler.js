import multer from "multer";
import { fail } from "../utils/response.js";

export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);

  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return fail(res, "Uploaded file exceeds the maximum allowed size", 413);
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
