import { ok, fail } from "../utils/response.js";
import { createJobSchema } from "../validators/job.js";
import { createJob, listJobs } from "../services/jobService.js";

export async function getJobs(req, res) {
  return ok(res, await listJobs());
}

export async function postJob(req, res, next) {
  try {
    const payload = createJobSchema.parse(req.body);
    return ok(res, await createJob(payload), 201);
  } catch (err) {
    if (err.name === "ZodError") {
      return fail(res, err.errors, 400);
    }
    return next(err);
  }
}
