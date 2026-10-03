import { Router } from "express";
import { getJobs, postJob } from "../controllers/jobController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const jobRoutes = Router();

jobRoutes.get("/", asyncHandler(getJobs));
jobRoutes.post("/", asyncHandler(postJob));
