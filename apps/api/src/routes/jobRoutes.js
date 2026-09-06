// Agent identity: Antigravity
// OS: mac
// CPU: arm64
// Home Path: /Users/macminim1
// Working Path: /Users/macminim1/Documents/efe
// Shell: /bin/zsh
// Guideline: - Maintain documentation integrity. Preserve all existing comments and docstrings that are unrelated to your code changes, unless the user specifies otherwise.

import { Router } from "express";
import { getJobs, postJob } from "../controllers/jobController.js";
import { authMiddleware } from "../middleware/auth.js";

export const jobRoutes = Router();

jobRoutes.get("/", getJobs);
jobRoutes.post("/", authMiddleware, postJob);
