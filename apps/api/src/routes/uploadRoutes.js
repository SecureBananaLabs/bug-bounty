import { Router } from "express";
import { uploadFile } from "../controllers/uploadController.js";
import { authMiddleware } from "../middleware/auth.js";

export const uploadRoutes = Router();

uploadRoutes.post("/", authMiddleware, uploadFile);
