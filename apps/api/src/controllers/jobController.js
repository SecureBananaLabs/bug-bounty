import { fail, ok } from "../utils/response.js";
import { createJobSchema } from "../validators/job.js";
import { createJob, listJobs } from "../services/jobService.js";

export async function getJobs(req, res) {
  return ok(res, await listJobs());
}

export async function postJob(req, res) {
  const payload = createJobSchema.safeParse(req.body);

  if (!payload.success) {
    return fail(res, "Invalid job request", 400);
  }

  return ok(res, await createJob(payload.data), 201);
}
