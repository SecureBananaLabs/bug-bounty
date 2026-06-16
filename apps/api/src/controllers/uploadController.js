import { fail, ok } from "../utils/response.js";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain"
];

export async function uploadFile(req, res) {
  if (!req.file) {
    return fail(res, "No file provided", 400);
  }
  if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
    return fail(res, `File type not allowed: ${req.file.mimetype}`, 415);
  }
  return ok(res, {
    filename: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    status: "uploaded"
  }, 201);
}
