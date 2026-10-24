import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf"
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"), false);
    }
  }
});

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), asyncHandler(uploadFile));
