import { Router } from "express";
import multer from "multer";
import { env } from "../config/env.js";
import { uploadFile } from "../controllers/uploadController.js";

export function createUploadRoutes(options = {}) {
  const maxFileSizeBytes = options.maxFileSizeBytes ?? env.uploadMaxFileSizeBytes;
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxFileSizeBytes }
  });
  const router = Router();

  router.post("/", upload.single("file"), uploadFile);

  router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: `File too large. Max size is ${maxFileSizeBytes} bytes`
      });
    }

    return next(error);
  });

  return router;
}

export const uploadRoutes = createUploadRoutes();
