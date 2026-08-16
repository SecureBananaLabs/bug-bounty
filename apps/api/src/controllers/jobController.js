import { fail, ok } from "../utils/response.js";
import { createJobSchema } from "../validators/job.js";
import { createJob, listJobs } from "../services/jobService.js";

export async function getJobs(req, res) {
  return ok(res, await listJobs());
}

export async function postJob(req, res) {
  const result = createJobSchema.safeParse(req.body);
  if (!result.success) {
    return fail(res, "Invalid job payload", 400);
  }

  const payload = result.data;
  return ok(res, await createJob(payload), 201);
}
