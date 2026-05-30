import { ok } from "../utils/response.js";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "text/plain", "application/json"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: "No file provided" });
  }
  if (req.file.size > MAX_FILE_SIZE) {
    return res.status(413).json({ error: "File too large. Maximum size is 10MB" });
  }
  if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
    return res.status(415).json({ error: "File type not allowed" });
  }
  return ok(res, {
    filename: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
    status: "uploaded"
  }, 201);
}