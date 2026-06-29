import { Router } from "express";
import { getJobs, postJob } from "../controllers/jobController.js";
import { wrapAsync } from "../utils/wrapAsync.js";

export const jobRoutes = Router();

jobRoutes.get("/", wrapAsync(getJobs));
jobRoutes.post("/", wrapAsync(postJob));
