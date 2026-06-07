import { ok } from "../utils/response.js";
import { createJobSchema } from "../validators/job.js";
import { createJob, listJobs } from "../services/jobService.js";
import { parseRequestPayload } from "../utils/validation.js";

export async function getJobs(req, res) {
  return ok(res, await listJobs());
}

export async function postJob(req, res) {
  const payload = parseRequestPayload(createJobSchema, req.body, res);
  if (!payload) return;

  return ok(res, await createJob(payload), 201);
}
