import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";

const MAX_UPLOAD_BYTES = 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_BYTES
  }
});

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), uploadFile);
