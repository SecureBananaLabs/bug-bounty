import { ok, fail } from "../utils/response.js";

const ALLOWED_MIME_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "text/plain", "text/csv",
  "application/json",
  "application/zip", "application/x-zip-compressed"
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadFile(req, res) {
  if (!req.file) {
    return fail(res, "No file provided", 400);
  }

  if (req.file.size === 0) {
    return fail(res, "Empty file submitted", 400);
  }

  if (req.file.size > MAX_FILE_SIZE) {
    return fail(res, "File exceeds maximum size of 10MB", 400);
  }

  if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
    return fail(res, `File type '${req.file.mimetype}' is not allowed`, 400);
  }

  return ok(res, {
    filename: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
    status: "uploaded"
  }, 201);
}
