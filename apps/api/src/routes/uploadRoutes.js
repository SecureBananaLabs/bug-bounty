import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";

export const UPLOAD_FILE_SIZE_LIMIT_BYTES = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: UPLOAD_FILE_SIZE_LIMIT_BYTES
  }
});

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), uploadFile);
