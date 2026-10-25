import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";

const maxUploadSizeBytes = 5 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxUploadSizeBytes }
});

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), uploadFile);
