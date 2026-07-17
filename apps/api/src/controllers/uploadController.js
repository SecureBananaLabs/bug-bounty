import { ok } from "../utils/response.js";

export async function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: "No file provided" });
  }
  // Sanitize filename - strip path separators, limit length
  const safe = req.file.originalname
    .replace(/[\\/\\x00-\\x1f]/g, "_")
    .slice(0, 255);
  return ok(res, {
    filename: safe,
    size: req.file.size,
    mimetype: req.file.mimetype,
    status: "uploaded"
  }, 201);
}
