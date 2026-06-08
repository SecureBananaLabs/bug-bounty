import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { fail } from "../utils/response.js";

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
]);

function filterUpload(req, file, callback) {
  if (!ALLOWED_UPLOAD_MIME_TYPES.has(file.mimetype)) {
    return callback(new Error("Unsupported file type"));
  }

  return callback(null, true);
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_SIZE_BYTES,
    files: 1
  },
  fileFilter: filterUpload
});

const singleFileUpload = upload.single("file");

function handleSingleFileUpload(req, res, next) {
  return singleFileUpload(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      const message = error.code === "LIMIT_FILE_SIZE" ? "File too large" : "Invalid upload";
      return fail(res, message, 400);
    }

    return fail(res, error.message || "Invalid upload", 400);
  });
}

export const uploadRoutes = Router();

uploadRoutes.post("/", handleSingleFileUpload, uploadFile);
