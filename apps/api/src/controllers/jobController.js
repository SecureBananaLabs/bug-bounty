import { ok } from "../utils/response.js";
import { createJobSchema } from "../validators/job.js";
import { createJob, listJobs } from "../services/jobService.js";

export async function getJobs(req, res) {
  return ok(res, await listJobs());
}

export async function postJob(req, res, next) {
  try {
    const payload = createJobSchema.parse(req.body);
    const result = await createJob(payload);
    return ok(res, result, 201);
  } catch (err) {
    return next(err);
  }
}
