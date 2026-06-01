import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";

const storage = multer.memoryStorage();

// 5 MB limit; only allow common document/image types
const fileFilter = (req, file, cb) => {
  const allowedMime = [
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf", "text/plain",
    "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip", "application/gzip",
  ];
  if (allowedMime.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter,
});

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), uploadFile);
