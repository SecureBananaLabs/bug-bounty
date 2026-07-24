import { Router } from "express";
import { getJobs, postJob } from "../controllers/jobController.js";
import { authenticate } from "../middleware/auth.js";

export const jobRoutes = Router();

jobRoutes.get("/", getJobs);
jobRoutes.post("/", authenticate, postJob);
