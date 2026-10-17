import { Router } from "express";
import { getJobs, postJob } from "../controllers/jobController.js";
import { authMiddleware } from "../middleware/auth.js";

export const jobRoutes = Router();

// Job listings and submissions are account-scoped, so every endpoint requires a bearer token.
jobRoutes.use(authMiddleware);
jobRoutes.get("/", getJobs);
jobRoutes.post("/", postJob);
