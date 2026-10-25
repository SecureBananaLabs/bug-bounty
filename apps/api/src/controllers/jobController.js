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
  } catch (err) {
    // Fix #1469 + #1467: Handle Zod validation errors with proper 400 status
    if (err.name === "ZodError") {
      return fail(res, {
        message: "Validation failed",
        errors: err.errors.map(e => ({
          field: e.path.join("."),
          message: e.message
        }))
      }, 400);
    }
    return fail(res, err.message || "Job creation failed", 400);
  }
}
