import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";

const maxUploadSize = process.env.MAX_UPLOAD_SIZE_MB 
  ? parseInt(process.env.MAX_UPLOAD_SIZE_MB, 10) * 1024 * 1024 
  : 5 * 1024 * 1024;

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxUploadSize,
    files: 1
  }
});

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), uploadFile);
