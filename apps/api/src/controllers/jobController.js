import { ok, fail } from "../utils/response.js";
import { validateCreateJob } from "../validators/job.js";
import { createJob, listJobs } from "../services/jobService.js";

export async function getJobs(req, res) {
  return ok(res, await listJobs());
}

export async function postJob(req, res) {
  const validation = validateCreateJob(req.body);
  if (!validation.ok) {
    return fail(res, validation.error, 400);
  }
  return ok(res, await createJob(validation.data), 201);
}

