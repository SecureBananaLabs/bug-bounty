import { Router } from "express";
import { getJobs, postJob } from "../controllers/jobController.js";
import { methodNotAllowed } from "../middleware/methodNotAllowed.js";

export const jobRoutes = Router();

jobRoutes.route("/")
  .get(getJobs)
  .post(postJob)
  .all(methodNotAllowed(["GET", "POST"]));
