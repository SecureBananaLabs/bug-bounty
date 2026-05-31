import { ok } from "../utils/response.js";
import { createJobSchema } from "../validators/job.js";
import { createJob, listJobs } from "../services/jobService.js";

export async function getJobs(req, res) {
  return ok(res, await listJobs());
}

export async function postJob(req, res) {
  const payload = createJobSchema.parse(req.body);
  // Enforce authenticated creator: use user ID from JWT token (issue #1783)
  const clientId = req.user.sub;
  return ok(res, await createJob({ ...payload, clientId }), 201);
}
