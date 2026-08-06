import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";

const upload = multer({ storage: multer.memoryStorage() });

export const uploadRoutes = Router();
uploadRoutes.use(authMiddleware);
uploadRoutes.post("/", upload.single("file"), uploadFile);
