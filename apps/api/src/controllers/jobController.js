import { fail, ok } from "../utils/response.js";
import { createJobSchema, updateJobStatusSchema } from "../validators/job.js";
import { createJob, listJobs, updateJobStatus } from "../services/jobService.js";

export async function getJobs(req, res) {
  return ok(res, await listJobs());
}

export async function postJob(req, res) {
  const payload = createJobSchema.parse(req.body);
  return ok(res, await createJob(payload), 201);
}

export async function patchJobStatus(req, res) {
  const parsed = updateJobStatusSchema.safeParse(req.body);

  if (!parsed.success) {
    return fail(res, "status must be a valid job status", 400);
  }

  const job = await updateJobStatus(req.params.id, parsed.data.status);

  if (!job) {
    return fail(res, "Job not found", 404);
  }

  return ok(res, job);
}
