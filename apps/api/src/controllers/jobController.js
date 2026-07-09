import { ok } from "../utils/response.js";
import { createJobSchema } from "../validators/job.js";
import { createJob, listJobs } from "../services/jobService.js";

export async function getJobs(req, res) {
  return ok(res, await listJobs());
}

export async function postJob(req, res) {
  const payload = createJobSchema.parse(req.body);
  
  if (req.user && payload.clientId !== req.user.sub) {
    return res.status(403).json({ success: false, error: "Forbidden: Cannot create job for another client" });
  }

  return ok(res, await createJob(payload), 201);
}
