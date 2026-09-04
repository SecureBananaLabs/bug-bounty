import { fail, ok } from "../utils/response.js";
import { createJobSchema } from "../validators/job.js";
import { createJob, listJobs } from "../services/jobService.js";

export async function getJobs(req, res) {
  return ok(res, await listJobs());
}

export async function postJob(req, res) {
  const parsed = createJobSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Invalid job payload", 400);
  }

  return ok(res, await createJob(parsed.data), 201);
}
