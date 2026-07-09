import { Router } from "express";
import { getJobs, postJob } from "../controllers/jobController.js";
import { authMiddleware } from "../middleware/auth.js";

export const jobRoutes = Router();

jobRoutes.use(authMiddleware);
jobRoutes.get("/", getJobs);
jobRoutes.post("/", postJob);
