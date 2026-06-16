import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { fail } from "../utils/response.js";

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp"
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_SIZE_BYTES
  },
  fileFilter: (req, file, callback) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return callback(null, true);
    }

    const error = new Error("Unsupported file type");
    error.statusCode = 415;
    return callback(error);
  }
});

function singleFileUpload(req, res, next) {
  upload.single("file")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return fail(res, "File exceeds maximum size of 5MB", 413);
    }

    if (error.statusCode === 415) {
      return fail(res, "Unsupported file type", 415);
    }

    return next(error);
  });
}

export const uploadRoutes = Router();

uploadRoutes.post("/", singleFileUpload, uploadFile);
