import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  }
});

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), uploadFile);
