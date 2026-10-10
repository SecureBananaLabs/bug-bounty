import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getJobs, getJob, postJob } from "../controllers/jobController.js";

export const jobRoutes = Router();

jobRoutes.get("/", getJobs);
jobRoutes.get("/:id", getJob);
jobRoutes.post("/", authMiddleware, postJob);
