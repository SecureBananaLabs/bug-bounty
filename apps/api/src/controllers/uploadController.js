import { ok } from "../utils/response.js";

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
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
    return res.status(415).json({
      success: false,
      message: `Unsupported file type: ${req.file.mimetype}`
    });
  }

  return ok(res, {
    filename: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    status: "uploaded"
  }, 201);
}
