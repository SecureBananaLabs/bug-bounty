import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getJobs, postJob } from "../controllers/jobController.js";

export const jobRoutes = Router();

jobRoutes.get("/", getJobs);
jobRoutes.post("/", authMiddleware, postJob);
