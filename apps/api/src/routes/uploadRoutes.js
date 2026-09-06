import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { fail } from "../utils/response.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

function singleFileUpload(req, res, next) {
  upload.single("file")(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return fail(res, "Uploaded file is too large", 413);
    }

    if (error) {
      return next(error);
    }

    return next();
  });
}

export const uploadRoutes = Router();

uploadRoutes.post("/", singleFileUpload, uploadFile);
