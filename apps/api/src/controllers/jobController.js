import { ok, fail } from "../utils/response.js";
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
  const { id } = req.params;
  const parsed = updateJobSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.issues.map((i) => i.message).join("; "), 400);
  }
  const updated = await updateJob(id, parsed.data);
  if (!updated) {
    return fail(res, "Job not found", 404);
  }
  return ok(res, updated);
}
