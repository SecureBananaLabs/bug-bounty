import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { fail } from "../utils/response.js";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const ALLOWED_UPLOAD_TYPES = new Map([
  ["image/png", new Set([".png"])],
  ["image/jpeg", new Set([".jpg", ".jpeg"])],
  ["image/webp", new Set([".webp"])],
  ["image/gif", new Set([".gif"])],
  ["application/pdf", new Set([".pdf"])],
  ["text/plain", new Set([".txt"])]
]);

function getExtension(filename) {
  if (typeof filename !== "string") {
    return "";
  }

  const normalizedName = filename.trim().toLowerCase();
  const dotIndex = normalizedName.lastIndexOf(".");

  return dotIndex > 0 ? normalizedName.slice(dotIndex) : "";
}

function isAllowedUpload(file) {
  const allowedExtensions = ALLOWED_UPLOAD_TYPES.get(file.mimetype?.toLowerCase());
  const extension = getExtension(file.originalname);

  return Boolean(allowedExtensions?.has(extension));
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1
  },
  fileFilter(req, file, callback) {
    if (!isAllowedUpload(file)) {
      return callback(
        new Error(
          "Unsupported file type. Allowed types are PNG, JPEG, WebP, GIF, PDF, and TXT."
        )
      );
    }

    return callback(null, true);
  }
}).single("file");

function handleUpload(req, res, next) {
  upload(req, res, (error) => {
    if (error) {
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          return fail(res, "File exceeds the 10MB limit", 400);
        }

        if (error.code === "LIMIT_FILE_COUNT") {
          return fail(res, "Only one file may be uploaded", 400);
        }

        if (error.code === "LIMIT_UNEXPECTED_FILE") {
          return fail(res, "No file provided", 400);
        }
      }

      return fail(
        res,
        error.message ||
          "Unsupported file type. Allowed types are PNG, JPEG, WebP, GIF, PDF, and TXT.",
        400
      );
    }

    return uploadFile(req, res, next);
  });
}

export const uploadRoutes = Router();

uploadRoutes.post("/", handleUpload);
