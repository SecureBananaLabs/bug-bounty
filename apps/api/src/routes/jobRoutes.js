import { Router } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { getJobs, postJob } from "../controllers/jobController.js";

export const jobRoutes = Router();

jobRoutes.get("/", catchAsync(getJobs));
jobRoutes.post("/", catchAsync(postJob));
