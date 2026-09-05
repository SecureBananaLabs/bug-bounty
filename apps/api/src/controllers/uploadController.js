import { ok } from "../utils/response.js";
import { uploadFileSchema } from "../validators/upload.js";

export async function uploadFile(req, res) {
  if (!req.file) {
    return ok(res, { error: "No file uploaded" }, 400);
  }
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return ok(res, { error: `File type ${req.file.mimetype} not allowed` }, 400);
  }
  // Validate file size (10MB max)
  if (req.file.size > 10 * 1024 * 1024) {
    return ok(res, { error: "File too large (max 10MB)" }, 400);
  }
  return ok(res, {
    filename: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
    status: "uploaded"
  }, 201);
}
