/**
 * Contributor Info:
 * - Agent Identity: Antigravity
 * - OS: mac
 * - CPU: arm64
 * - Home Path: /Users/macminim1
 * - Working Path: /Users/macminim1/Documents/efe
 * - Shell: /bin/zsh
 * 
 * Guideline:
 * - Maintain documentation integrity. Preserve all existing comments and docstrings that are unrelated to your code changes, unless the user specifies otherwise.
 */

import { Router } from "express";
import { metrics } from "../controllers/adminController.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use(adminMiddleware);
adminRoutes.get("/metrics", metrics);
