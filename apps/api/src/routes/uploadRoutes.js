import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const upload = multer({ storage: multer.memoryStorage() });

export const uploadRoutes = Router();

uploadRoutes.post("/", authMiddleware, upload.single("file"), uploadFile);
