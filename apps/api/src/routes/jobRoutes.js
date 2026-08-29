import { Router } from "express";
import { getJobs, postJob, patchJob } from "../controllers/jobController.js";

export const jobRoutes = Router();

jobRoutes.get("/", getJobs);
jobRoutes.post("/", postJob);
jobRoutes.patch("/:id", patchJob);
