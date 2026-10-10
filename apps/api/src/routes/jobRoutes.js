import { Router } from "express";
import { getJobs, patchJobStatus, postJob } from "../controllers/jobController.js";

export const jobRoutes = Router();

jobRoutes.get("/", getJobs);
jobRoutes.post("/", postJob);
jobRoutes.patch("/:id/status", patchJobStatus);
