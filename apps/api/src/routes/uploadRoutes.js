import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { fail } from "../utils/response.js";

const ALLOWED_MIME_TYPES = [
 "image/jpeg",
 "image/png",
 "image/gif",
 "image/webp",
 "application/pdf"
];

const upload = multer({
 storage: multer.memoryStorage(),
 limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
 fileFilter(_req, file, cb) {
 if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
 cb(null, true);
 } else {
 cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`));
 }
 }
});

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), uploadFile);
