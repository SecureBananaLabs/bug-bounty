import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/auth.js";
import { uploadFile } from "../controllers/uploadController.js";

const ALLOWED_MIME_TYPES = ["image/jpeg","image/png","image/gif","image/webp","application/pdf","text/plain"];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    ALLOWED_MIME_TYPES.includes(file.mimetype) ? cb(null, true) : cb(new Error(`Unsupported type: ${file.mimetype}`))
});

export const uploadRoutes = Router();
uploadRoutes.post("/", authMiddleware, upload.single("file"), uploadFile);
