import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { uploadFile } from '../controllers/uploadController.js';
import { authMiddleware } from '../middleware/auth.js';

export const uploadRoutes = Router();

uploadRoutes.post("/", authMiddleware, upload.single("file"), uploadFile);
