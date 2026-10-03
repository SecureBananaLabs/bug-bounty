import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

function uploadFileFilter(req, file, callback) {
  if (allowedMimeTypes.has(file.mimetype)) {
    return callback(null, true);
  }

  const error = new Error("Unsupported file type");
  error.code = "UNSUPPORTED_UPLOAD_TYPE";
  return callback(error);
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
    files: 1
  },
  fileFilter: uploadFileFilter
});

function uploadErrorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message:
        err.code === "LIMIT_FILE_SIZE" ? "Uploaded file is too large" : "Invalid upload"
    });
  }

  if (err?.code === "UNSUPPORTED_UPLOAD_TYPE") {
    return res.status(400).json({
      success: false,
      message: "Unsupported file type"
    });
  }

  return next(err);
}

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), uploadErrorHandler, uploadFile);
