import { ok, fail } from "../utils/response.js";
import path from "path";

// Allowlist of safe file types
const ALLOWED_MIMETYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/json",
];

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function uploadFile(req, res) {
  if (!req.file) {
    return fail(res, "No file provided in request", 400);
  }

  // Validate file size
  if (req.file.size > MAX_FILE_SIZE) {
    return fail(res, `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`, 400);
  }

  // Validate mimetype against allowlist
  // Note: req.file.mimetype comes from client Content-Type header
  // and can be spoofed. For production, use file-type library or
  // libmagic for server-side MIME detection.
  if (!ALLOWED_MIMETYPES.includes(req.file.mimetype)) {
    return fail(res, `File type not allowed: ${req.file.mimetype}. Allowed: ${ALLOWED_MIMETYPES.join(", ")}`, 400);
  }

  // Validate file extension matches mimetype
  const ext = path.extname(req.file.originalname).toLowerCase();
  const extToMime = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
    ".txt": "text/plain",
    ".csv": "text/csv",
    ".json": "application/json",
  };

  if (extToMime[ext] && extToMime[ext] !== req.file.mimetype) {
    return fail(res, "File extension does not match content type", 400);
  }

  return ok(res, {
    filename: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
    status: "uploaded"
  }, 201);
}
