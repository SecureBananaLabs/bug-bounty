import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { fail } from "../utils/response.js";

const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1
  },
  fileFilter(req, file, callback) {
    if (ALLOWED_UPLOAD_MIME_TYPES.has(file.mimetype)) {
      return callback(null, true);
    }

    return callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
  }
});

function handleUpload(req, res, next) {
  upload.single("file")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return fail(res, "Unsupported upload payload", 400);
      }

      if (error.code === "LIMIT_UNEXPECTED_FILE") {
        return fail(res, "Unsupported upload payload", 400);
      }
    }

    return next(error);
  });
}

export const uploadRoutes = Router();

uploadRoutes.post("/", handleUpload, uploadFile);
