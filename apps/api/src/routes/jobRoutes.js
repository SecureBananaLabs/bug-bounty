import { Router } from "express";
import { getJobs, postJob } from "../controllers/jobController.js";
import { authMiddleware } from "../middleware/auth.js";

export const jobRoutes = Router();

// Job listing is public — any visitor can browse available jobs.
// Job creation requires authentication to track ownership.
jobRoutes.get("/", getJobs);
jobRoutes.post("/", authMiddleware, postJob);
