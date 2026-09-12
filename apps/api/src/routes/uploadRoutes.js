// Agent identity: Antigravity
// OS: mac
// CPU: arm64
// Home Path: /Users/macminim1
// Working Path: /Users/macminim1/Documents/efe
// Shell: /bin/zsh
// Guideline: - Maintain documentation integrity. Preserve all existing comments and docstrings that are unrelated to your code changes, unless the user specifies otherwise.

import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { authMiddleware } from "../middleware/auth.js";

const upload = multer({ storage: multer.memoryStorage() });

export const uploadRoutes = Router();

uploadRoutes.post("/", authMiddleware, upload.single("file"), uploadFile);

