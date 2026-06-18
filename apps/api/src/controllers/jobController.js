import { ok, fail } from "../utils/response.js";
import { createJobSchema } from "../validators/job.js";
import { createJob, listJobs } from "../services/jobService.js";

export async function getJobs(req, res) {
  return ok(res, await listJobs());
}

export async function postJob(req, res) {
  let payload;
  try {
    payload = createJobSchema.parse(req.body);
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: err.errors
    });
  }

  // IDOR fix: clientId in payload must match the authenticated user
  if (payload.clientId !== req.user.sub) {
    return fail(res, "Cannot create a job for another client account", 403);
  }

  return ok(res, await createJob(payload), 201);
}
