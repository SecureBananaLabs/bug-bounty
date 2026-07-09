import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { catchAsync } from "../utils/catchAsync.js";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE }
});

export const uploadRoutes = Router();

uploadRoutes.post("/", catchAsync(upload.single("file")), catchAsync(uploadFile));
