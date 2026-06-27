import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";

export const uploadFileSizeLimit = 5 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: uploadFileSizeLimit }
});

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), uploadFile);
