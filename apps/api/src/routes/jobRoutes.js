import { Router } from "express";
import { getJobs, getJob, postJob } from "../controllers/jobController.js";

export const jobRoutes = Router();

jobRoutes.get("/", getJobs);
jobRoutes.get("/:id", getJob);
jobRoutes.post("/", postJob);
