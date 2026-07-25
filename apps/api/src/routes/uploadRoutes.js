import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { authMiddleware } from "../middleware/auth.js";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed. Accepted: ${ALLOWED_MIME_TYPES.join(", ")}`));
    }
  },
});

export const uploadRoutes = Router();

uploadRoutes.post("/", authMiddleware, upload.single("file"), (req, res, next) => {
  uploadFile(req, res).catch(next);
});

// Handle multer errors (file too large, disallowed type)
uploadRoutes.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: `File exceeds maximum size of ${MAX_FILE_SIZE / (1024 * 1024)}MB` });
  }
  if (err.message && err.message.includes("not allowed")) {
    return res.status(400).json({ error: err.message });
  }
  return res.status(500).json({ error: "Upload failed" });
});
