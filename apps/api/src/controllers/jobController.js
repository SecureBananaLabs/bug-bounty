import { ok, notFound } from "../utils/response.js";
import { createJobSchema, updateJobSchema } from "../validators/job.js";
import { createJob, listJobs, getJobById, updateJob } from "../services/jobService.js";

export async function getJobs(req, res) {
  return ok(res, await listJobs());
}

export async function getJob(req, res) {
  const job = await getJobById(req.params.id);
  if (!job) return notFound(res, "Job not found");
  return ok(res, job);
}

export async function postJob(req, res) {
  const payload = createJobSchema.parse(req.body);
  return ok(res, await createJob(payload), 201);
}

export async function patchJob(req, res) {
  const payload = updateJobSchema.parse(req.body);
  const job = await updateJob(req.params.id, payload);
  if (!job) return notFound(res, "Job not found");
  return ok(res, job);
}
