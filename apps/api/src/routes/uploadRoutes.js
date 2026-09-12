import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";

const upload = multer({ storage: multer.memoryStorage() });

uploadRoutes.use(authMiddleware);

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), uploadFile);
