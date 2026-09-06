import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { fail } from "../utils/response.js";

export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf"
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: UPLOAD_MAX_BYTES },
  fileFilter(req, file, callback) {
    if (allowedMimeTypes.has(file.mimetype)) {
      return callback(null, true);
    }

    return callback(new Error("Unsupported file type"));
  }
});

export const uploadRoutes = Router();

function uploadSingleFile(req, res, next) {
  upload.single("file")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return fail(res, `File too large. Maximum upload size is ${UPLOAD_MAX_BYTES} bytes.`, 413);
    }

    return fail(res, "Unsupported file type", 400);
  });
}

uploadRoutes.post("/", uploadSingleFile, uploadFile);
