import { fail, ok } from "../utils/response.js";
import { createJobSchema } from "../validators/job.js";
import { createJob, listJobs } from "../services/jobService.js";

export async function getJobs(req, res) {
  return ok(res, await listJobs());
}

export async function postJob(req, res) {
  if (req.body.clientId !== undefined && req.body.clientId !== req.user.sub) {
    return fail(res, "Client id does not match authenticated user", 403);
  }

  const payload = createJobSchema.parse(req.body);
  return ok(res, await createJob({ ...payload, clientId: req.user.sub }), 201);
}
