import { ok } from "../utils/response.js";
import { createJobSchema } from "../validators/job.js";
import { createJob, listJobs } from "../services/jobService.js";

export async function getJobs(req, res) {
  const filters = {
    status: req.query?.status,
    categoryId: req.query?.categoryId,
    minBudget: req.query?.minBudget,
  };
  return ok(res, await listJobs(filters));
}

export async function postJob(req, res) {
  const payload = createJobSchema.parse(req.body);
  return ok(res, await createJob(payload), 201);
}
