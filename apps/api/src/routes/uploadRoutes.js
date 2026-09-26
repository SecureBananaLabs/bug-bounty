import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";

const maxUploadSizeBytes = 10 * 1024 * 1024;
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/gif", "application/pdf"]);

function fileFilter(req, file, callback) {
  if (!allowedMimeTypes.has(file.mimetype)) {
    const error = new Error("Unsupported file type");
    error.statusCode = 400;
    return callback(error);
  }

  return callback(null, true);
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxUploadSizeBytes },
  fileFilter
});

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), uploadFile);
