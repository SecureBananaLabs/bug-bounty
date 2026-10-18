import { Router } from "express";
import rateLimit from "express-rate-limit";
import { getJobs, postJob } from "../controllers/jobController.js";

const jobLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 });

export const jobRoutes = Router();

jobRoutes.get("/", getJobs);
jobRoutes.post("/", jobLimiter, postJob);
