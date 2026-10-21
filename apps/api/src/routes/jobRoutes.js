import { Router } from "express";
import { getJob, getJobs, postJob } from "../controllers/jobController.js";

export const jobRoutes = Router();

jobRoutes.get("/", getJobs);
jobRoutes.get("/:id", getJob);
jobRoutes.post("/", postJob);
