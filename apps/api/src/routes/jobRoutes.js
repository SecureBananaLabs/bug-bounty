import { Router } from "express";
import { getJobs, postJob } from "../controllers/jobController.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const jobRoutes = Router();

jobRoutes.get("/", getJobs);
jobRoutes.post("/", postJob);
