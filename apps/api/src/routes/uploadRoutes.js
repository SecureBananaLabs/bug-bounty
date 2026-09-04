import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { fail } from "../utils/response.js";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES }
});

function singleFileUpload(req, res, next) {
  upload.single("file")(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return fail(res, "File too large", 413);
    }

    if (error) {
      return next(error);
    }

    return next();
  });
}

export const uploadRoutes = Router();

uploadRoutes.post("/", singleFileUpload, uploadFile);
