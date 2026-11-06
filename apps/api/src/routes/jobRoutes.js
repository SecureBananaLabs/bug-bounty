import { Router } from "express";
import { getJobs, postJob } from "../controllers/jobController.js";
import { methodNotAllowed } from "../middleware/methodNotAllowed.js";

export const jobRoutes = Router();

jobRoutes.get("/", getJobs);
jobRoutes.post("/", postJob);
jobRoutes.all("/", methodNotAllowed(["GET", "POST"]));
