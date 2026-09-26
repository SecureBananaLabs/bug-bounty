import { ok } from "../utils/response.js";
import { createJobSchema } from "../validators/job.js";
import { createJob, listJobs } from "../services/jobService.js";
import { fail } from "../utils/response.js";

export async function getJobs(req, res) {
  return ok(res, await listJobs());
}

export async function postJob(req, res) {
  const result = createJobSchema.safeParse(req.body);
  if (!result.success) {
    return fail(res, result.error.issues[0]?.message ?? "Invalid job payload", 400);
  }

  const payload = result.data;
  return ok(res, await createJob(payload), 201);
}
