import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE }
});

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), uploadFile);
