import { ok } from "../utils/response.js";
import { createJobSchema } from "../validators/job.js";
import { createJob, listJobs } from "../services/jobService.js";

export async function getJobs(req, res) {
  return ok(res, await listJobs());
}

export async function postJob(req, res, next) {
  const parsed = createJobSchema.safeParse(req.body);
  if (!parsed.success) {
    // Forward the ZodError so errorHandler can render it as a 400 that names
    // each offending field.
    return next(parsed.error);
  }

  return ok(res, await createJob(parsed.data), 201);
}
