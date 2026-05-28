import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";

const upload = multer({ storage: multer.memoryStorage() });

export const uploadRoutes = Router();
import { authMiddleware } from "../middleware/auth.js";

uploadRoutes.post(authMiddleware, "/", upload.single(authMiddleware, "file"), uploadFile);
