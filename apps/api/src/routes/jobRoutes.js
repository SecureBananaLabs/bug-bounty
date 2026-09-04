import { Router } from "express";
import { getJobs, postJob } from "../controllers/jobController.js";
import { catchAsync } from "../utils/catchAsync.js";

export const jobRoutes = Router();

jobRoutes.get("/", catchAsync(getJobs));
jobRoutes.post("/", catchAsync(postJob));
