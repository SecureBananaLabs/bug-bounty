import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { fail } from "../utils/response.js";

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_SIZE },
  fileFilter(req, file, callback) {
    if (!file.mimetype.startsWith("image/")) {
      const error = new Error("Unsupported file type");
      error.code = "UNSUPPORTED_FILE_TYPE";
      return callback(error);
    }

    return callback(null, true);
  }
});

function uploadSingleFile(req, res, next) {
  upload.single("file")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return fail(res, "File too large. Maximum size is 5 MiB.", 413);
    }

    if (error.code === "UNSUPPORTED_FILE_TYPE") {
      return fail(res, "Unsupported file type. Only images are allowed.", 400);
    }

    return next(error);
  });
}

export const uploadRoutes = Router();

uploadRoutes.post("/", uploadSingleFile, uploadFile);
