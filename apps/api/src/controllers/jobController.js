import { ok, fail } from "../utils/response.js";
import { createJobSchema } from "../validators/job.js";
import { createJob, listJobs } from "../services/jobService.js";

export async function getJobs(req, res) {
  return ok(res, await listJobs());
}

export async function postJob(req, res) {
  try {
    const payload = createJobSchema.parse(req.body);
    return ok(res, await createJob(payload), 201);
  } catch (error) {
    if (error.name === "ZodError") {
      const issue = error.issues[0];
      return fail(res, issue ? issue.message : "Validation failed", 400);
    }
    return fail(res, "Job creation error", 500);
  }
}
