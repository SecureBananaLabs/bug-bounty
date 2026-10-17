import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";

export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_SIZE_BYTES
  }
});

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), uploadFile);
