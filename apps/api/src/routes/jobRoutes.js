import { Router } from "express";
import { getJobs, postJob } from "../controllers/jobController.js";
import { validate } from "../middleware/validate.js";
import { createJobSchema } from "../validators/job.js";

export const jobRoutes = Router();

jobRoutes.get("/", getJobs);
jobRoutes.post("/", validate(createJobSchema), postJob);
