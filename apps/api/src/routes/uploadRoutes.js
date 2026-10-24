import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/auth.js";
import { uploadFile } from "../controllers/uploadController.js";
const ALLOWED = ["image/jpeg","image/png","image/gif","image/webp","application/pdf","text/plain"];
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_r, f, cb) => ALLOWED.includes(f.mimetype) ? cb(null, true) : cb(new Error(`Unsupported type: ${f.mimetype}`)) });
export const uploadRoutes = Router();
uploadRoutes.post("/", authMiddleware, upload.single("file"), uploadFile);
