import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { fail } from "../utils/response.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});
const uploadSingleFile = upload.single("file");

export const uploadRoutes = Router();

uploadRoutes.post("/", (req, res, next) => {
  uploadSingleFile(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return fail(res, "File too large", 413);
    }

    if (error) {
      return next(error);
    }

    return uploadFile(req, res);
  });
});
