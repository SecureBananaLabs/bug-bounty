import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getJobs, postJob } from "../controllers/jobController.js";

export const jobRoutes = Router();

jobRoutes.use(authMiddleware);

jobRoutes.get("/", getJobs);
jobRoutes.post("/", postJob);