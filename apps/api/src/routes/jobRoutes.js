import { Router } from "express";
import { getJobs, getJob, postJob, patchJob } from "../controllers/jobController.js";

export const jobRoutes = Router();

jobRoutes.get("/", getJobs);
jobRoutes.get("/:id", getJob);
jobRoutes.post("/", postJob);
jobRoutes.patch("/:id", patchJob);
