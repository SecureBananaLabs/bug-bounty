import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { fail } from "../utils/response.js";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "application/pdf"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = new Error("Unsupported file type");
      error.status = 415;
      return cb(error);
    }

    return cb(null, true);
  }
});

export const uploadRoutes = Router();

function handleUpload(req, res, next) {
  upload.single("file")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return fail(res, "File is too large", 413);
    }

    if (error.status === 415) {
      return fail(res, "Unsupported file type", 415);
    }

    return next(error);
  });
}

uploadRoutes.post("/", handleUpload, uploadFile);
