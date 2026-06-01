import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { fail } from "../utils/response.js";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_UPLOAD_TYPES = new Set([
  "application/pdf",
  "image/gif",
  "image/jpeg",
  "image/png"
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter(req, file, callback) {
    if (ALLOWED_UPLOAD_TYPES.has(file.mimetype)) {
      return callback(null, true);
    }

    const error = new Error("Unsupported file type");
    error.code = "UNSUPPORTED_FILE_TYPE";
    return callback(error);
  }
});

function uploadSingleFile(req, res, next) {
  return upload.single("file")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error.code === "LIMIT_FILE_SIZE") {
      return fail(res, "File exceeds 5 MB upload limit", 413);
    }

    if (error.code === "UNSUPPORTED_FILE_TYPE") {
      return fail(res, "Unsupported file type", 400);
    }

    return next(error);
  });
}

export const uploadRoutes = Router();

uploadRoutes.post("/", uploadSingleFile, uploadFile);
