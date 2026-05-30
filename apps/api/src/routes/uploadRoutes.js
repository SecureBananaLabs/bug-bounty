import { Router } from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";

const upload = multer({ storage: multer.memoryStorage() });

const uploadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10 });

export const uploadRoutes = Router();

uploadRoutes.post("/", uploadLimiter, upload.single("file"), uploadFile);
