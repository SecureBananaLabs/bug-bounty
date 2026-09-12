import { Router } from "express";
import { getJobs, postJob } from "../controllers/jobController.js";
import { authMiddleware } from "../middleware/auth.js";

export const jobRoutes = Router();

jobRoutes.get("/", getJobs);
jobRoutes.post("/", authMiddleware, postJob);
