import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5mb

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), uploadFile);
