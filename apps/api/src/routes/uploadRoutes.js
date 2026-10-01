import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { fail } from "../utils/response.js";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
    files: 1
  }
});

function uploadSingleFile(req, res, next) {
  upload.single("file")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return fail(res, "File exceeds the 5 MB upload limit", 413);
      }

      return fail(res, "Invalid upload payload", 400);
    }

    return next(error);
  });
}

export const uploadRoutes = Router();

uploadRoutes.post("/", uploadSingleFile, uploadFile);
