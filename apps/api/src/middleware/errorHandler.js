import { fail } from "../utils/response.js";
import { ZodError } from "zod";

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ZodError) {
    return fail(res, err.errors[0]?.message || "Invalid request", 400);
  }

  if (err?.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return fail(res, "Uploaded file is too large", 413);
    }
    return fail(res, err.message || "Invalid upload", 400);
  }

  console.error("Unhandled API error:", String(err?.message ?? "Unexpected server error"));
  return fail(res, "Unexpected server error", 500);
}
