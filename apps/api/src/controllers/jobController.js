import { ok } from "../utils/response.js";
import { createJobSchema } from "../validators/job.js";
import { createJob, listJobs } from "../services/jobService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getJobs = asyncHandler(async (req, res) => {
  return ok(res, await listJobs());
});

export const postJob = asyncHandler(async (req, res) => {
  const payload = createJobSchema.parse(req.body);
  return ok(res, await createJob(payload), 201);
});
