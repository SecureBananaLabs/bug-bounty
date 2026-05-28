import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), uploadFile);
