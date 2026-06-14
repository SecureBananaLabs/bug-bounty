import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";

const upload = multer({ storage: multer.memoryStorage() });

export const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), uploadFile);
