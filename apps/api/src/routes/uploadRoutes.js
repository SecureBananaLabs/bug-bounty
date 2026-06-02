import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/rtf",
  "application/vnd.oasis.opendocument.text"
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter(req, file, cb) {
    if (allowedMimeTypes.has(file.mimetype)) {
      return cb(null, true);
    }

    return cb(new Error("Invalid file type"));
  }
});

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), uploadFile);
