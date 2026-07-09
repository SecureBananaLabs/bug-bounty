import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";

/** Permitted MIME types for uploaded files.
 *  Executables, scripts, and arbitrary binaries are blocked by default. */
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
]);

const upload = multer({
  storage: multer.memoryStorage(),
  // 5 MB in-memory limit prevents memory exhaustion from large uploads.
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(Object.assign(
        new Error(`File type '${file.mimetype}' is not allowed.`),
        { status: 415 }
      ));
    }
  }
});

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), uploadFile);

