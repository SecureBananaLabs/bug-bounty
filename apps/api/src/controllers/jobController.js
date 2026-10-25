import { fail, ok } from "../utils/response.js";
import { createJobSchema } from "../validators/job.js";
import { createJob, getJobById, listJobs } from "../services/jobService.js";

export async function getJobs(req, res) {
  return ok(res, await listJobs());
}

export async function getJob(req, res) {
  const job = await getJobById(req.params.id);
  if (!job) {
    return fail(res, "Not found", 404);
  }
  return ok(res, job);
}

export async function postJob(req, res) {
  const payload = createJobSchema.parse(req.body);
  return ok(res, await createJob(payload), 201);
}
