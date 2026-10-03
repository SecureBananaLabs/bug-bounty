import { fail, ok } from "../utils/response.js";
import { createJobSchema, updateJobSchema } from "../validators/job.js";
import { createJob, listJobs, updateJob } from "../services/jobService.js";

export async function getJobs(req, res) {
  return ok(res, await listJobs());
}

export async function postJob(req, res) {
  const payload = createJobSchema.parse(req.body);
  return ok(res, await createJob(payload), 201);
}

export async function patchJob(req, res) {
  const payload = updateJobSchema.parse(req.body);
  const job = await updateJob(req.params.id, payload);

  if (!job) {
    return fail(res, "Job not found", 404);
  }

  return ok(res, job);
}
