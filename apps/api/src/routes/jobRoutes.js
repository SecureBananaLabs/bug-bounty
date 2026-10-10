import { Router } from "express";
import { getJobs, postJob } from "../controllers/jobController.js";
import { authMiddleware } from "../middleware/auth.js";

export const jobRoutes = Router();

// Jobs are created and listed on behalf of one account, so both handlers need
// the verified bearer identity instead of answering every anonymous caller.
jobRoutes.use(authMiddleware);
jobRoutes.get("/", getJobs);
jobRoutes.post("/", postJob);
