import { ok, fail } from "../utils/response.js";
import { createJob, listJobs } from "../services/jobService.js";
import { createJobSchema } from "../validators/job.js";

export async function getJobs(req, res) {
  return ok(res, await listJobs());
}

export async function postJob(req, res) {
  const parsed = createJobSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Invalid job payload: " + parsed.error.issues.map(i => i.message).join(", "), 400);
  }
  return ok(res, await createJob(parsed.data), 201);
}
