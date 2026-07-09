import multer from "multer";
import { fail } from "../utils/response.js";

const ALLOWED_MIMES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
];

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
}).single("file");

export function uploadMiddleware(req, res, next) {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return fail(res, "File too large. Max 10 MB", 400);
    }
    if (err) {
      return fail(res, "Upload error: " + err.message, 400);
    }
    if (!req.file) {
      return fail(res, "Invalid file type. Accepted: JPEG, PNG, GIF, WebP, PDF, DOC, DOCX, TXT", 400);
    }
    return next();
  });
}
