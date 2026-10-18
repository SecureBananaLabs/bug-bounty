import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/auth.js";
import { uploadFile } from "../controllers/uploadController.js";

const upload = multer({ storage: multer.memoryStorage() });

export const uploadRoutes = Router();

uploadRoutes.post("/", authMiddleware, upload.single("file"), uploadFile);