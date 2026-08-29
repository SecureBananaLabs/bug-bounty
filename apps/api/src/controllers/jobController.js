import { ok, fail } from "../utils/response.js";
import { createJobSchema } from "../validators/job.js";
import { createJob, listJobs } from "../services/jobService.js";

export async function getJobs(req, res) {
  return ok(res, await listJobs());
}

export async function postJob(req, res) {
  const { title, description } = req.body || {};
  if (!title || typeof title !== "string" || title.trim().length < 3) {
    return fail(res, "Job title must be at least 3 characters.", 400);
  }
  if (description && typeof description === "string" && description.length > 10000) {
    return fail(res, "Description too long. Maximum is 10000 characters.", 400);
  }
  const payload = createJobSchema.parse(req.body);
  return ok(res, await createJob(payload), 201);
}
