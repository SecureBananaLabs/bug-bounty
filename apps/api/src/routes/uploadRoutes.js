import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { uploadFile } from "../controllers/uploadController.js";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

export const uploadRoutes = Router();

uploadRoutes.use(authMiddleware);
uploadRoutes.post("/", upload.single("file"), uploadFile);
