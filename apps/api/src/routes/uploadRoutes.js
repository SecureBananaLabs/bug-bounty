import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { authMiddleware } from "../middleware/auth.js";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(Object.assign(new Error(`Unsupported file type: ${file.mimetype}`), { status: 400 }));
    }
  }
});

export const uploadRoutes = Router();

uploadRoutes.use(authMiddleware);
uploadRoutes.post("/", upload.single("file"), uploadFile);
