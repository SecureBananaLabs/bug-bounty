import { sanitizeFilename } from "../utils/sanitize.js";

export function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Missing file field in multipart upload"
    });
  }
  return res.status(201).json({
    success: true,
    data: {
      filename: sanitizeFilename(req.file.originalname),
      size: req.file.size,
      mimetype: req.file.mimetype,
      status: "uploaded"
    }
  });
}
