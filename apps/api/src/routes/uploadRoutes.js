import { Router } from "express";
import { uploadFile } from "../controllers/uploadController.js";
import { uploadMiddleware } from "../middleware/upload.js";

export const uploadRoutes = Router();

uploadRoutes.post("/", uploadMiddleware, uploadFile);
