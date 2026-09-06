import { fail, ok } from "../utils/response.js";
import { createJobSchema } from "../validators/job.js";
import { createJob, listJobs } from "../services/jobService.js";

export async function getJobs(req, res) {
  return ok(res, await listJobs());
}

export async function postJob(req, res) {
  let payload;
  try {
    payload = createJobSchema.parse(req.body);
  } catch (error) {
    return fail(res, error.issues?.[0]?.message ?? "Invalid job payload", 400);
  }
  return ok(res, await createJob(payload), 201);
}
