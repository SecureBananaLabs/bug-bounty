import { fail } from "../utils/response.js";

/**
 * Route-level guard for upload endpoints.
 *
 * Rejects multipart requests that did not include the expected file field
 * with a 400 response. This keeps 2xx upload responses reserved for
 * requests that actually carried a file payload.
 */
export function requireUploadFile(req, res, next) {
  if (req.file) {
    next();
    return;
  }
  fail(res, "Missing file field in multipart upload", 400);
}
