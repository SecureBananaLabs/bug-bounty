import { ZodError } from "zod";
import { fail } from "../utils/response.js";

export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const messages = err.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`
    );
    return fail(res, `Validation error: ${messages.join("; ")}`, 422);
  }

  // Handle Multer file-size errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return fail(res, "File too large. Maximum size is 10 MB.", 413);
  }

  // Handle Multer / file-filter errors
  if (err.message?.startsWith("File type not allowed")) {
    return fail(res, err.message, 415);
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
