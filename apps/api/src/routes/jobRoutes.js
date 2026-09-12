import { Router } from "express";
import { getJobs, patchJob, postJob } from "../controllers/jobController.js";

export const jobRoutes = Router();

jobRoutes.get("/", getJobs);
jobRoutes.post("/", postJob);
jobRoutes.patch("/:id", patchJob);
