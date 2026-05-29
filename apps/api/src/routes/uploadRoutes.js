import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/gif", "application/pdf", "text/plain", "text/csv"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed. Allowed: ${ALLOWED_MIMES.join(", ")}`));
    }
  }
});

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), uploadFile);
