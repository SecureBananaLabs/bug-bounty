import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { authMiddleware } from "../middleware/auth.js";

const upload = multer({ storage: multer.memoryStorage() });

export const uploadRoutes = Router();

// Uploads must be authenticated to prevent anonymous file injection.
uploadRoutes.post("/", authMiddleware, upload.single("file"), uploadFile);

